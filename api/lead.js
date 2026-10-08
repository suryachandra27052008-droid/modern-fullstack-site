import {createLeadHandler} from '../server/lead.js';

// Vercel's framework-independent Web Standard function; dist remains the static output.
export default {fetch:createLeadHandler()};
