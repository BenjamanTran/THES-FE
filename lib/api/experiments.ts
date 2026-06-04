import { request } from "./client"
import type { ExperimentsPayload } from "./types"

export function fetchExperiments() {
  return request<{ experiments: ExperimentsPayload }>("/api/v1/experiments")
}
