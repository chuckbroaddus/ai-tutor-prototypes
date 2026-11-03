import asyncio,sys,json
from playwright.async_api import async_playwright
B='http://localhost:8811/skill-galaxy/';O='/workspace/ai-tutor/site/skill-galaxy/shots/'
# (name, url, js-after-load, wait ms)
S=json.load(open(sys.argv[1]))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'])
    for n,u,js,wait in S:
      c=await b.new_context(viewport={'width':1280,'height':800},color_scheme='dark')
      pg=await c.new_page();logs=[]
      pg.on('console',lambda m:logs.append(m.type+': '+m.text) if m.type in('error','warning') else None);pg.on('pageerror',lambda e:logs.append('PAGEERROR '+str(e)))
      await pg.goto(B+u);await pg.wait_for_timeout(900)
      if js:
        await pg.evaluate(js);await pg.wait_for_timeout(wait or 900)
      await pg.screenshot(path=O+n+'.png');print(n,logs[:6]);await c.close()
    await b.close()
asyncio.run(main())
