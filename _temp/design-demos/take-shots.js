const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage();
  await pg.setViewportSize({width:1280,height:900});
  const base = 'file://' + __dirname;
  
  for (const [file, out] of [
    ['demo-control-room.html','control-room-dash.png'],
    ['demo-bunker.html','bunker-dash.png'],
    ['demo-terminal.html','terminal-dash.png'],
  ]) {
    await pg.goto(`${base}/${file}`);
    await pg.click('button:text("Dashboard")');
    await pg.waitForTimeout(400);
    await pg.screenshot({path: out});
    console.log('done', out);
  }
  await br.close();
})().catch(e => { console.error(e.message); process.exit(1); });
