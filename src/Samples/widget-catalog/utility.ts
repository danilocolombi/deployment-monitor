import * as SDK from "azure-devops-extension-sdk";
import {
  CommonServiceIds,
  IProjectPageService,
  getClient,
} from "azure-devops-extension-api";
import { EnvironmentClient } from "./EnvironmentClient";
import { EnvironmentDetail } from "../widget-configuration/EnvironmentDetail";
import { Environment } from "../widget-configuration/Environment";

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
  environmentId: number
): Promise<EnvironmentDetail[]> {
  const projectId = await getCurrentProjectId();
  const map = new Map<string, number>();

  const deploymentRecords = await getClient(
    EnvironmentClient
  ).getAllDeploymentRecords(projectId!, environmentId);

  for (let j = 0; j < deploymentRecords.length; j++) {
    const key = deploymentRecords[j].definition.name;
    const currentValue = map.get(key);
    if (currentValue) {
      map.set(key, currentValue + 1);
    } else {
      map.set(key, 1);
    }
  }

  const environmentDetails: EnvironmentDetail[] = [];
  map.forEach((value, key) => {
    environmentDetails.push({
      name: key,
      deploymentRecordCount: value,
    });
  });

  return environmentDetails;
}
