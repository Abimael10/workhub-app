import { ProjectStatus } from "./types";

const transitions: Record<ProjectStatus, ProjectStatus[]> = {
  BACKLOG: ["IN_PROGRESS"],
  IN_PROGRESS: ["BACKLOG", "BLOCKED", "DONE"],
  BLOCKED: ["IN_PROGRESS"],
  DONE: [],
};

export function canTransition(from: ProjectStatus, to: ProjectStatus) {
  return from === to ? true : transitions[from].includes(to);
}

export function assertTransition(from: ProjectStatus, to: ProjectStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`No se puede mover el proyecto de ${from} a ${to}`);
  }
}
