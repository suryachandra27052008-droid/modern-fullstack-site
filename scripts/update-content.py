"""Refresh static content from content/site-content.json. No deployment dependencies."""
from pathlib import Path
from html import escape
from urllib.parse import quote, urlsplit
import json
import re
from policy_pages import POLICY_TITLES, business_details, render_policy_pages

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
DATA = json.loads((ROOT / 'content/site-content.json').read_text(encoding='utf-8'))
VERSION = '20261008.11'
BASE = 'https://autixai-site.vercel.app'
C = DATA['contact']
e = lambda value: escape(str(value), quote=True)
WA = f"https://wa.me/{C['whatsapp']}"

def block(html, key, value):
    pattern = rf'<!-- content:{key}:start -->.*?<!-- content:{key}:end -->'
    return re.sub(pattern, lambda _: f'<!-- content:{key}:start -->\n{value}\n<!-- content:{key}:end -->', html, flags=re.S)

def brand():
    return f'<a class="brand" href="/" aria-label="AutixAI home"><img class="brand-logo" src="/branding/autixai-logo-original.jpg" width="1600" height="1600" alt=""><span class="brand-name">{e(C["name"])}</span></a>'

def navigation(page):
    links=[]
    for item in DATA['navigation']:
        href=item['href']
        if page == '': href=href.removeprefix('/') if href.startswith('/#') else href
        current=' aria-current="page"' if item['href']==f'/{page}/' else ''
        links.append(f'<a href="{e(href)}"{current}>{e(item["label"])}</a>')
    return ''.join(links)

def header(page):
    audit='#contact' if not page else '/?intent=consultation#contact'
    # Short top navigation; the complete set appears in the mobile menu and footer.
    top=[DATA['navigation'][i] for i in [0,1,3]]
    nav=''.join(f'<a href="{e(item["href"].removeprefix("/") if not page and item["href"].startswith("/#") else item["href"])}"'+(' aria-current="page"' if item['href']==f'/{page}/' else '')+f'>{e(item["label"])}</a>' for item in top)
    nav+='<a href="/trust/"'+(' aria-current="page"' if page=='trust' else '')+'>Trust</a>'
    return f'''<header class="site-header"><div class="container nav-inner">{brand()}<nav class="desktop-nav" aria-label="Main navigation">{nav}</nav><a href="{audit}" class="button button-small header-cta cta-beam" data-intent="consultation" data-booking-link><span class="cta-beam-inner" data-booking-label>Request a Free Consultation</span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button></div><nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" hidden>{navigation(page)}<a href="/trust/">Trust & data</a><a href="{'/?intent=consultation#contact' if page else '#contact'}" data-intent="consultation" data-booking-link>Request a Free Consultation</a></nav></header>'''

def social_links():
    social=''
    for item in C.get('socials',[]):
        if urlsplit(item.get('url','')).scheme=='https': social+=f'<a href="{e(item["url"])}" target="_blank" rel="noopener noreferrer">{e(item["label"])}</a>'
    return social

def footer(page):
    social=social_links()
    email=f'<a href="mailto:{e(C["email"])}">{e(C["email"])}</a>' if C.get('email') else ''
    return f'''<footer class="site-footer"><div class="container footer-top"><div class="footer-identity">{brand()}<p>AI automation systems for modern businesses.</p></div><nav aria-label="Footer navigation">{navigation(page)}<a href="/trust/">Trust & data</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a><a href="/refunds/">Payments & refunds</a><a href="/cookies/">Cookies & privacy choices</a><a href="/accessibility/">Accessibility</a><a href="/privacy/#privacy-request">Privacy requests</a></nav><div class="footer-contact"><a href="tel:{e(C['phone'])}">{e(C['displayPhone'])}</a><a href="{WA}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>{email}{social}<a data-social-link hidden target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><button type="button" class="inline-link" data-privacy-settings>Privacy & motion settings</button></div></div><div class="container footer-bottom"><span>© <span id="year">2026</span> AutixAI. All rights reserved.</span><span>Built around your business.</span></div></footer>'''

def service_section():
    rows=[]
    icons=['M5 5h22v17H14l-7 5v-5H5z M10 11h12 M10 16h8', 'M6 24 15 15l5 5L27 7 M19 7h8v8', 'M6 6h8v8H6z M18 6h8v8h-8z M6 18h8v8H6z M18 18h8v8h-8z', 'M26 15a11 11 0 0 1-16 10l-6 2 2-6A11 11 0 1 1 26 15z M11 10c1 5 4 8 9 9', 'M8 8h5 M19 8h5 M8 24h5 M19 24h5 M16 11v10 M13 8h6v6h-6z M13 20h6v6h-6z', 'M6 26V15h4v11 M14 26V6h4v20 M22 26V11h4v15', 'M16 4l3 9 9 3-9 3-3 9-3-9-9-3 9-3z']
    for i,s in enumerate(DATA['services'],1):
        rows.append(f'''<article class="service-card glass" role="group" aria-roledescription="slide" aria-label="{i} of {len(DATA['services'])}: {e(s['title'])}"><div class="service-card-top"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="{icons[(i-1)%len(icons)]}"/></svg></span><span class="service-index">{i:02} / {len(DATA['services']):02}</span></div><h3>{e(s['title'])}</h3><p class="service-card-copy">{e(s['description'])}</p><div class="service-card-workflow"><span>EXAMPLE WORKFLOW</span><p>{e(s['workflow'])}</p></div><p class="service-card-benefit">{e(s['benefit'])}</p><a class="service-card-link" href="#contact" data-intent="audit" data-track="service_card_click" data-service-link="{e(s['title'])}" aria-label="Discuss {e(s['title'])}">Let’s build this<span aria-hidden="true">↗</span></a></article>''')
    industries=''.join(f'<option value="{e(a["id"])}">{e(a["title"])}</option>' for a in DATA['industries'])
    industry=DATA['industries'][0]
    return f'''<section id="services" class="container section"><div class="section-heading"><div><div class="eyebrow accent-text">01 / WHAT WE DO</div><h2>A smarter way<br>to get work done.</h2></div><p>Practical systems for sales, support and operations. Remove repeat work so your people can focus on customers and decisions.</p></div><div class="service-carousel" role="region" aria-roledescription="carousel" aria-label="Business automation services"><div class="service-carousel-bar"><p id="service-scroll-hint">Seven ways to take work off your plate. Swipe to explore.</p><div class="service-carousel-controls" hidden><button type="button" data-service-prev aria-label="Previous service">←</button><button type="button" data-service-pause aria-pressed="false">Pause motion</button><button type="button" data-service-next aria-label="Next service">→</button></div></div><div class="service-viewport" tabindex="0" aria-label="Scroll through seven services" aria-describedby="service-scroll-hint"><div class="services-grid service-track">{''.join(rows)}</div></div><p class="sr-only" id="service-motion-status" role="status"></p></div>
<div class="industry-explorer"><div><h3>Built around your business.</h3><p>Choose your industry for a few practical ideas.</p><label for="industry-choice">Your industry</label><select id="industry-choice">{industries}</select></div><div class="industry-ideas"><h4 id="industry-title">Ideas for {e(industry['title'])}</h4><ul id="industry-ideas">{''.join(f'<li>{e(idea)}</li>' for idea in industry['ideas'])}</ul><a id="industry-inquiry" class="text-link" href="#contact" data-intent="consultation" data-booking-link>Request a Free Consultation</a><p id="industry-status" class="sr-only" role="status"></p></div></div><noscript><p class="input-hint">Interactive choices need JavaScript. The examples above and all service descriptions remain available.</p></noscript></section>'''

def cases():
    cards=[]
    for s in DATA['caseStudies']:
        verified=s.get('kind')=='verified'
        label='Client Case Study' if verified else 'Example Automation'
        rows=[('Industry',s['industry']),('Problem',s['problem']),('Before',s['before']),('Automation built' if verified else 'Possible automation',s['automation']),('After' if verified else 'Potential outcome',s['after']),('Business impact' if verified else 'Potential business impact',s['impact']),('Tools integrated' if verified else 'Example tools',' · '.join(s['tools']))]
        if verified and s.get('company'): rows.insert(0,('Company',s['company']))
        if verified and s.get('hoursSaved') is not None: rows.append(('Verified time returned',s['hoursSaved']))
        cards.append(f'<details class="case-card"><summary><span class="eyebrow accent-text">{label}</span><h4>{e(s["title"])}</h4><p>{e(s["problem"])}</p><span class="case-open">View the workflow <span aria-hidden="true">+</span></span></summary><dl>{"".join(f"<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>" for k,v in rows)}</dl><a class="text-link" href="#contact" data-intent="audit">Discuss a similar workflow →</a></details>')
    note='Real client case studies coming soon.' if not any(s.get('kind')=='verified' for s in DATA['caseStudies']) else 'Client outcomes relate to the stated project and are not a guarantee for other businesses.'
    intro='Cards marked Client Case Study describe delivered work. Example Automation cards are illustrative.' if any(s.get('kind')=='verified' for s in DATA['caseStudies']) else 'Explore what a connected process could look like. These examples are not claimed client results.'
    return f'<section id="case-studies" class="case-section" aria-labelledby="cases-heading"><div class="compact-heading"><span class="eyebrow accent-text">PRACTICAL EXAMPLES</span><h3 id="cases-heading">Automation in the real world.</h3><p>{intro}</p></div><div class="case-grid">{"".join(cards)}</div><p class="input-hint">{note}</p></section>'

ICON_PATHS={'chat':'M4 4h16v12H9l-5 4Z','table':'M4 4h16v16H4ZM4 10h16M10 4v16','mail':'M3 5h18v14H3ZM3 5l9 7 9-7','document':'M6 3h8l4 4v14H6ZM9 11h6M9 15h6','connect':'M5 6h5v5H5ZM14 13h5v5h-5ZM10 8h6v5M7 11v5h7','shop':'M4 9h16v12H4ZM8 9V7a4 4 0 0 1 8 0v2','payment':'M3 5h18v14H3ZM3 10h18M6 15h4','spark':'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z'}
def integrations():
    items=[]
    for tool in DATA['integrations']:
        items.append(f'<li class="integration-tool"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="{ICON_PATHS[tool["type"]]}"/></svg><span>{e(tool["name"])}</span></li>')
    badges=''.join(items)
    return f'''<div id="integrations" class="integration-strip"><h3 id="integrations-heading">Works with the tools you already use.</h3><div class="integration-marquee-row"><div class="tool-marquee" tabindex="0" role="region" aria-labelledby="integrations-heading" aria-describedby="marquee-help"><div class="tool-marquee-track"><ul class="tool-marquee-set" aria-label="Integration tools">{badges}</ul><ul class="tool-marquee-set marquee-copy" aria-hidden="true" inert>{badges}</ul></div></div><button type="button" class="marquee-toggle" aria-label="Pause tool marquee" aria-pressed="false" title="Pause tool marquee" hidden><span aria-hidden="true">Ⅱ</span></button></div><span id="marquee-help" class="sr-only">Pause using the round control, hover, focus this row, or touch and hold. With reduced motion, scroll horizontally to explore the tools.</span><p>And if your tool has an API, we can usually connect it.</p><small>Illustrative tool categories; availability depends on your APIs, plans and permissions. No official partnership is implied.</small></div>'''

def pricing():
    cards=[]
    for p in DATA['pricing']:
        cards.append(f'<article class="scope-card"><h3>{e(p["title"])}</h3><p>{e(p["bestFor"])}</p><ul class="plain-list">{"".join(f"<li>{e(item)}</li>" for item in p["examples"])}</ul><a class="button button-outline" href="/?intent=quote#contact" data-track="pricing_enquiry">Discuss Your Workflow</a></article>')
    return f'<section class="info-section" aria-labelledby="pricing-heading"><h2 id="pricing-heading">Pricing depends on what you want to automate.</h2><div class="scope-grid">{"".join(cards)}</div><p class="info-note">After understanding your workflow, we provide a clear implementation scope and quote before development begins.</p></section>'

def confidence():
    return '''<section class="confidence-section container" aria-labelledby="why-heading"><div class="compact-heading"><span class="eyebrow accent-text">WHY AUTIXAI?</span><h2 id="why-heading">Automation should simplify your business — not make it harder to run.</h2></div><div class="confidence-grid"><div><ul class="principles"><li>Built around your current workflow and tools</li><li>Human approval wherever needed</li><li>Understandable systems your team can use</li><li>AI only where it helps the process</li><li>Measure the improvement, then expand</li></ul><a class="text-link" href="/pricing/">Explore project scopes and pricing →</a></div><details class="security-note"><summary><h3>Your systems. Your data. Your control.</h3><span>See the principles behind a build <span aria-hidden="true">+</span></span></summary><ul class="principles"><li>Access only to systems required by the workflow</li><li>Secure API connections where supported</li><li>Sensitive credentials kept out of frontend code</li><li>Human review for critical actions</li><li>Logging and monitoring scoped to your needs</li><li>Designed around your existing infrastructure</li></ul><a class="text-link" href="/trust/">Read our data and handover approach →</a></details></div></section>'''

def faq():
    items=[f'<details><summary>{e(f["question"])}</summary><p>{e(f["answer"])}</p></details>' for f in DATA['faq']]
    return f'<section id="faq" class="faq-section container"><div><div class="eyebrow accent-text">A FEW GOOD QUESTIONS</div><h2>Let’s clear<br>things up.</h2></div><div class="faq-list">{"".join(items[:6])}<details class="more-faq"><summary>More about control, timing and cost</summary><div class="faq-more-list">{"".join(items[6:])}</div></details></div></section>'

TITLES={
    '':('AutixAI — AI Automation for Businesses','AutixAI builds AI-powered automation systems for businesses. Automate leads, customer support, operations, reporting, WhatsApp workflows and repetitive tasks.'),
    'pricing':('Pricing & Project Scope | AutixAI','Explore one-workflow automation, connected business systems and custom AI projects. Get a clear scope and quote before development.'),
    'trust':('Trust, Data & Human Control | AutixAI','How AutixAI approaches system access, AI review, workflow testing, ownership and handover. Define the controls in your project scope.'),
    'privacy':('Privacy Policy | AutixAI','How AutixAI handles website enquiries, WhatsApp drafts, hosting information and privacy requests.'),
    'terms':('Website Terms | AutixAI','Terms for using the AutixAI website, free audit enquiries, illustrative workflow demos and automation estimates.')}

render_policy_pages(DIST, C, VERSION)
TITLES.update({slug: (title+' | AutixAI', description) for slug, (title, description) in POLICY_TITLES.items()})

for slug,(title,description) in TITLES.items():
    path=DIST/slug/'index.html'
    html=path.read_text(encoding='utf-8')
    html=re.sub(r'<header class="site-header">.*?</header>',lambda _:header(slug),html,flags=re.S)
    html=re.sub(r'<footer class="site-footer">.*?</footer>',lambda _:footer(slug),html,flags=re.S)
    html=re.sub(r'<title>.*?</title>',f'<title>{e(title)}</title>',html)
    html=re.sub(r'<link rel="icon"[^>]*>', '',html)
    html=html.replace('</head>','<link rel="icon" href="/branding/autixai-logo-original.jpg" type="image/jpeg">\n</head>')
    for key,value in [('description',description),('og:title',title),('og:description',description),('twitter:title',title),('twitter:description',description),('og:url',BASE+('/'+slug+'/' if slug else '/'))]:
        html=re.sub(rf'(<meta (?:name|property)="{key}" content=")[^"]*(")',lambda m:m[1]+e(value)+m[2],html)
    canonical=BASE+('/'+slug+'/' if slug else '/')
    html=re.sub(r'<link rel="canonical" href="[^"]+">',f'<link rel="canonical" href="{canonical}">',html)
    html=re.sub(r'\?v=\d{8}\.\d+',f'?v={VERSION}',html)
    html=re.sub(r'<script[^>]+src="/privacy-tools.js[^\"]*"[^>]*></script>', '',html)
    html=html.replace('</body>',f'<script type="module" src="/privacy-tools.js?v={VERSION}"></script></body>')
    html=re.sub(r'<script[^>]+src="/card-effects.js[^\"]*"[^>]*></script>', '',html)
    html=html.replace('</body>',f'<script src="/card-effects.js?v={VERSION}" defer></script></body>')
    html=re.sub(r'<script[^>]+src="/ui-effects.js[^\"]*"[^>]*></script>', '',html)
    html=html.replace('</body>',f'<script src="/ui-effects.js?v={VERSION}" defer></script></body>')
    html=re.sub(r'(<main\b[^>]*)(>)', lambda m:m[1]+(' tabindex="-1"' if 'tabindex=' not in m[1] else '')+m[2], html, count=1)
    for asset in ['booking', 'enquiry-delivery']:
        html=re.sub(r'<script[^>]+src="/?'+asset+r'\.js[^\"]*"[^>]*></script>', '', html)
        html=re.sub(r'(<script src="/?common\.js)', lambda m:f'<script src="/{asset}.js?v={VERSION}" defer></script>'+m[1], html, count=1)
    if 'site-config.js' not in html: html=html.replace('<script src="/common.js',f'<script src="/site-config.js?v={VERSION}" defer></script><script src="/common.js',1)
    html=re.sub(r'<script src="/assistant-loader.js[^\"]*"[^>]*></script>', '',html)
    html=html.replace('</body>',f'<script src="/assistant-loader.js?v={VERSION}" data-whatsapp="{C["whatsapp"]}" defer></script></body>')
    if slug: html=re.sub(r'<script src="/content-data.js[^\"]*" defer></script>', '',html)
    org={'@context':'https://schema.org','@type':'Organization','name':C['name'],'url':BASE+'/','logo':BASE+'/branding/autixai-logo-original.jpg','description':'AI automation systems for modern businesses.','contactPoint':{'@type':'ContactPoint','telephone':C['phone'],'contactType':'sales','availableLanguage':'English'}}
    social_urls=[item['url'] for item in C.get('socials',[]) if urlsplit(item.get('url','')).scheme=='https']
    if social_urls: org['sameAs']=social_urls
    if C.get('email'): org['email']=C['email']
    if C.get('legalName'): org['legalName']=C['legalName']
    if not slug:
        if '<!-- content:contact-socials:start -->' not in html:
            html=re.sub(r'(<div class="contact-links">.*?</div>)',lambda m:m[1]+'<!-- content:contact-socials:start --><!-- content:contact-socials:end -->',html,count=1,flags=re.S)
        html=block(html,'contact-socials',f'<div class="contact-socials">{social_links()}</div>' if social_links() else '')
        if '<!-- content:business-details:start -->' not in html:
            html=html.replace('<!-- content:contact-socials:end -->','<!-- content:contact-socials:end --><!-- content:business-details:start --><!-- content:business-details:end -->',1)
        html=block(html,'business-details',f'<details class="business-note"><summary>Business & policy details</summary>{business_details(C)}<p><a href="/terms/">Website terms</a> · <a href="/refunds/">Payments & refunds</a> · <a href="/privacy/#privacy-request">Privacy requests</a></p></details>')
        html=html.replace('class="text-link" href="#contact">Get My Free Automation Audit','class="text-link" href="#contact" data-intent="audit">Get My Free Automation Audit')
        html=block(html,'services',service_section())
        html=block(html,'cases',cases())
        html=block(html,'integrations',integrations())
        html=block(html,'confidence',confidence())
        html=block(html,'faq',faq())
        options='<option value="">Choose your industry</option>'+''.join(f'<option>{e(i["title"])}</option>' for i in DATA['industries'])+'<option>Other / mixed business</option>'
        html=block(html,'industry-options',options)
        faq_schema={'@type':'FAQPage','mainEntity':[{'@type':'Question','name':f['question'],'acceptedAnswer':{'@type':'Answer','text':f['answer']}} for f in DATA['faq']]}
        schema={'@context':'https://schema.org','@graph':[{k:v for k,v in org.items() if k!='@context'},faq_schema]}
    else: schema=org
    if slug=='pricing': html=block(html,'pricing',pricing())
    html=re.sub(r'[ \t]*<script type="application/ld\+json">.*?</script>\n?', '',html,flags=re.S)
    html=html.replace('</head>','<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script>\n</head>')
    html=html.replace('<span class="brand-name">Autixai</span>','<span class="brand-name">AutixAI</span>')
    html=re.sub(r'href="tel:[^"]*"',f'href="tel:{C["phone"]}"',html)
    html=re.sub(r'https://wa.me/\d+', WA, html)
    def phone_text(match):
        text=re.sub(r'\+\d[\d ]{8,}',C['displayPhone'],match[2])
        return match[1]+text+match[3]
    html=re.sub(r'(<a\b[^>]*href="tel:[^"]+"[^>]*>)([^<]*)(</a>)',phone_text,html)
    html='\n'.join(line.rstrip() for line in html.splitlines())+'\n'
    html=re.sub(r'\n(?:[ \t]*\n)+','\n',html)
    path.write_text(html,encoding='utf-8')

runtime={key:DATA[key] for key in ['contact','areas','industries']}
(DIST/'content-data.js').write_text("'use strict';\n// Generated by scripts/update-content.py. Edit content/site-content.json.\nwindow.AUTIXAI_CONTENT = "+json.dumps(runtime,ensure_ascii=False).replace('<','\\u003c')+';\n',encoding='utf-8')
assistant_data={key:DATA[key] for key in ['contact','areas','industries','services','integrations','pricing','faq','assistant']}
(DIST/'assistant-data.json').write_text(json.dumps(assistant_data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
for filename in ['assistant.js', 'privacy-tools.js']:
    module=DIST/filename
    module.write_text(re.sub(r'\?v=\d{8}\.\d+',f'?v={VERSION}',module.read_text(encoding='utf-8')),encoding='utf-8')
(DIST/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n',encoding='utf-8')
(DIST/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE+"/"+slug+"/" if slug else BASE+"/"}</loc></url>' for slug in TITLES)+'</urlset>\n',encoding='utf-8')
print(f'Updated {len(TITLES)} pages, shared components, structured data and discovery files.')
