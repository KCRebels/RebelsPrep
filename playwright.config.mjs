import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./browser-tests',use:{baseURL:'http://127.0.0.1:4173',headless:true,launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined}},webServer:{command:'node browser-tests/server.mjs',url:'http://127.0.0.1:4173/roster-manager.html',reuseExistingServer:false}});

