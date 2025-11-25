import { platform } from "os";

export function getPlatform(): NodeJS.Platform {
  return platform();
}
