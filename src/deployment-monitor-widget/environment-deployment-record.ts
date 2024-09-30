import { TaskResult } from "azure-devops-extension-api/Build";

export interface EnvironmentDeploymentRecord {
  id: number;
  environmentId: number;
  definition: Definition;
  result: TaskResult;
  queueTime: Date;
  startTime: Date;
  finishTime: Date;
}

interface Definition {
  id: number;
  name: string;
  _links: Links;
}

interface Links {
  web: Web;
}

interface Web {
  href: string;
}