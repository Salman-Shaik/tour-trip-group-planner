import { expect,test } from "@playwright/test";

const inviteCode="goa-december-x7k29";
const email="returning-traveller@example.test";

async function testLogin(page:import("@playwright/test").Page){await page.goto("/login");const decline=page.getByRole("button",{name:"Decline"});await decline.waitFor({state:"visible",timeout:3_000}).then(()=>decline.click()).catch(()=>undefined);await page.getByLabel("Name").fill("Returning Traveller");await page.getByLabel("Email").fill(email);await page.getByRole("button",{name:"Sign in as test account"}).click();await expect(page).toHaveURL(/\/$/);}

test("a signed-in guest recovers the same trip and participant on a new browser",async({browser},testInfo)=>{
  test.skip(testInfo.project.name!=="chromium","Cross-browser account recovery only needs one desktop project.");
  test.setTimeout(60_000);
  const first=await browser.newContext();const firstPage=await first.newPage();
  await firstPage.goto(`/trip/${inviteCode}/join`);await firstPage.getByLabel("What should we call you?").fill("Returning Traveller");await firstPage.getByRole("button",{name:"Join the trip"}).click();await expect(firstPage).toHaveURL(new RegExp(`/trip/${inviteCode}$`));
  await testLogin(firstPage);await first.close();

  const second=await browser.newContext();const secondPage=await second.newPage();await testLogin(secondPage);await secondPage.goto("/trips");
  const tripLink=secondPage.getByRole("link",{name:/Joined Goa December Trip/});await expect(tripLink).toBeVisible();await expect(tripLink.getByText("Joined",{exact:true})).toBeVisible();
  await tripLink.click();await expect(secondPage).toHaveURL(new RegExp(`/trip/${inviteCode}$`));await expect(secondPage.getByRole("link",{name:"Preferences"}).first()).toBeVisible();await second.close();
});
