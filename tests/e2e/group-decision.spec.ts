import { expect,test } from "@playwright/test";
import { resetTestDatabase } from "./reset-database";

const inviteCode="goa-december-x7k29";
const stays=["Casa Sol","The Palm House","Salt & Sky Villa","Mango Grove Retreat"];
const voteLabels=["Love","Like","Maybe","No"] as const;

test.beforeEach(()=>resetTestDatabase());

function seededRandom(seed:number){
  let state=seed>>>0;
  return()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/2**32;
  };
}

test("ten participants vote and the creator selects the group result",async({browser,page},testInfo)=>{
  test.skip(testInfo.project.name!=="chromium","The multi-session group scenario only needs one browser project.");
  test.setTimeout(120_000);

  const random=seededRandom(20260825);
  for(let participantNumber=5;participantNumber<=10;participantNumber++){
    const context=await browser.newContext();
    const participantPage=await context.newPage();
    await participantPage.goto(`/trip/${inviteCode}/join`);
    await participantPage.getByLabel("What should we call you?").fill(`Traveller ${participantNumber}`);
    await participantPage.getByRole("button",{name:"Join the trip"}).click();
    await expect(participantPage).toHaveURL(new RegExp(`/trip/${inviteCode}$`));

    for(const stay of stays){
      const card=participantPage.locator("article").filter({has:participantPage.getByRole("heading",{name:stay})});
      const vote=voteLabels[Math.floor(random()*voteLabels.length)];
      const button=card.getByRole("button",{name:new RegExp(`^${vote}\\b`)});
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed","true");
      await expect(button).toBeEnabled();
    }
    await context.close();
  }

  await page.goto("/");
  await page.getByRole("button",{name:/Open as creator/}).click();
  await page.locator('a[href$="/participants"]:visible').first().click();
  await expect(page.getByText("10/10 joined",{exact:true})).toBeVisible();

  await page.locator('a[href$="/settings"]:visible').first().click();
  await page.getByRole("button",{name:"Lock voting now"}).click();

  await page.locator('a[href$="/results"]:visible').first().click();
  await expect(page.getByText("10 participants",{exact:true})).toBeVisible();
  await expect(page.getByText("40 votes",{exact:false})).toBeVisible();

  const winningResult=page.locator("article").first();
  const winningStay=(await winningResult.getByRole("heading").textContent())?.trim();
  expect(winningStay).toBeTruthy();
  page.once("dialog",dialog=>dialog.accept());
  await winningResult.getByRole("button",{name:"Select this stay"}).click();
  await expect(winningResult.getByRole("button",{name:"Selected stay"})).toBeVisible();
  await expect(page.getByText(`Selected stay: ${winningStay}`,{exact:true})).toBeVisible();
});
