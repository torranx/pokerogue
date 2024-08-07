import { bypassLogin } from "./battle-scene";
import * as Utils from "./utils";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
  discordId: string;
  googleId: string;
}

export let loggedInUser: UserInfo = null;
// This is a random string that is used to identify the client session - unique per session (tab or window) so that the game will only save on the one that the server is expecting
export const clientSessionId = Utils.randomString(32);

export function initLoggedInUser(): void {
  loggedInUser = { username: "Guest", lastSessionSlot: -1, discordId: "", googleId: ""};
}

export function updateUserInfo(): Promise<[boolean, integer]> {
  return new Promise<[boolean, integer]>(resolve => {
    if (bypassLogin) {
      loggedInUser = { username: "Guest", lastSessionSlot: -1, discordId: "", googleId: "" };
      let lastSessionSlot = -1;
      for (let s = 0; s < 5; s++) {
        if (localStorage.getItem(`sessionData${s ? s : ""}_${loggedInUser.username}`)) {
          lastSessionSlot = s;
          break;
        }
      }
      loggedInUser.lastSessionSlot = lastSessionSlot;
      // Migrate old data from before the username was appended
      [ "data", "sessionData", "sessionData1", "sessionData2", "sessionData3", "sessionData4" ].map(d => {
        if (localStorage.hasOwnProperty(d)) {
          if (localStorage.hasOwnProperty(`${d}_${loggedInUser.username}`)) {
            localStorage.setItem(`${d}_${loggedInUser.username}_bak`, localStorage.getItem(`${d}_${loggedInUser.username}`));
          }
          localStorage.setItem(`${d}_${loggedInUser.username}`, localStorage.getItem(d));
          localStorage.removeItem(d);
        }
      });
      return resolve([ true, 200 ]);
    }
    Utils.apiFetch("account/info", true).then(response => {
      if (!response.ok) {
        resolve([ false, response.status ]);
        return;
      }
      return response.json();
    }).then(jsonResponse => {
      loggedInUser = jsonResponse;
      resolve([ true, 200 ]);
    }).catch(err => {
      console.error(err);
      resolve([ false, 500 ]);
    });
  });
}
