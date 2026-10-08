import {randomUUID} from 'node:crypto';

const TTL = 86400; // Fingerprints/receipts only; never enquiry text or contact details.
export class MemoryLeadStore {
  constructor(now = Date.now) { this.entries = new Map(); this.now = now; }
  async claim(key, id) {
    for (const [item, value] of this.entries) if (value.expires <= this.now()) this.entries.delete(item);
    const previous = this.entries.get(key);
    if (previous) return {claimed:false, ...previous};
    if (this.entries.size >= 2000) throw new Error('Receipt capacity reached');
    const value = {id, token:randomUUID(), state:'processing', expires:this.now() + TTL * 1000};
    this.entries.set(key, value);
    return {claimed:true, ...value};
  }
  async settle(key, token, state) {
    const entry = this.entries.get(key);
    if (!entry || entry.token !== token) throw new Error('Receipt ownership lost');
    entry.state = state;
  }
  async release(key, token) { if (this.entries.get(key)?.token === token) this.entries.delete(key); }
}

// REST commands avoid adding a runtime SDK. Each script is atomic in Redis.
export class RedisLeadStore {
  constructor(url, token, fetcher = fetch) {
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Invalid Redis URL');
    this.url = endpoint.href; this.token = token; this.fetcher = fetcher;
  }
  async command(command) {
    const response = await this.fetcher(this.url, {
      method:'POST', headers:{Authorization:`Bearer ${this.token}`, 'Content-Type':'application/json'},
      body:JSON.stringify(command), signal:AbortSignal.timeout(4000), redirect:'error'
    });
    if (!response.ok) throw new Error('Receipt store unavailable');
    const data = await response.json();
    if (data.error || !Object.hasOwn(data, 'result')) throw new Error('Invalid store response');
    return data.result;
  }
  async claim(key, id) {
    const entry = {id, token:randomUUID(), state:'processing'};
    const result = await this.command(['EVAL', "local v=redis.call('GET',KEYS[1]); if v then return {0,v} end; redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[2]); return {1,ARGV[1]}", '1', `autixai:lead:${key}`, JSON.stringify(entry), String(TTL)]);
    if (!Array.isArray(result) || ![0,1].includes(result[0])) throw new Error('Invalid store receipt');
    return {claimed:result[0] === 1, ...JSON.parse(result[1])};
  }
  async settle(key, token, state) {
    const result = await this.command(['EVAL', "local v=redis.call('GET',KEYS[1]); if not v then return 0 end; local d=cjson.decode(v); if d.token~=ARGV[1] then return 0 end; d.state=ARGV[2]; redis.call('SET',KEYS[1],cjson.encode(d),'EX',ARGV[3]); return 1", '1', `autixai:lead:${key}`, token, state, String(TTL)]);
    if (result !== 1) throw new Error('Receipt ownership lost');
  }
  async release(key, token) {
    await this.command(['EVAL', "local v=redis.call('GET',KEYS[1]); if v and cjson.decode(v).token==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0", '1', `autixai:lead:${key}`, token]);
  }
  async rateLimit(key) {
    const count = await this.command(['EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n", '1', `autixai:rate:${key}`]);
    if (!Number.isInteger(count)) throw new Error('Invalid rate limit response');
    return count <= 5;
  }
}
