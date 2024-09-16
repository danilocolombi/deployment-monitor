import * as SDK from "azure-devops-extension-sdk";
import {
  CommonServiceIds,
  IProjectPageService,
  getClient,
} from "azure-devops-extension-api";
import { EnvironmentClient } from "./environment-client";
import { EnvironmentDetails } from "./environment-details";
import { Environment } from "./environment";
import { EnvironmentDeploymentRecord } from "./environment-deployment-record";

async function getCurrentProjectId(): Promise<string | undefined> {
  const pps = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );
  const project = await pps.getProject();
  return project?.id;
}

export async function getAllEnvironments(): Promise<Environment[]> {
  const projectId = await getCurrentProjectId();
  const environments = await getClient(EnvironmentClient).getAllEnvironments(
    projectId!
  );

  return environments;
}

export async function getDeploymentRecords(
  environments: Environment[]
): Promise<EnvironmentDetails[]> {
  const projectId = await getCurrentProjectId();

  const result: EnvironmentDetails[] = [];

  for (let environment of environments) {
    const deploymentRecords = await getClient(
      EnvironmentClient
    ).getAllDeploymentRecords(projectId!, environment.id);

    const map = new Map<string, number>();

    for (let j = 0; j < deploymentRecords.length; j++) {
      const key = deploymentRecords[j].definition.name;
      const currentValue = map.get(key);
      if (currentValue) {
        map.set(key, currentValue + 1);
      } else {
        map.set(key, 1);
      }
    }

    map.forEach((value, key) => {
      result.push({
        name: key,
        environmentName: environment.name,
        deploymentRecordCount: value,
      });
    });
  }

  return result;
}
