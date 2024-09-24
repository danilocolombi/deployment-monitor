import * as SDK from "azure-devops-extension-sdk";
import {
  CommonServiceIds,
  IProjectPageService,
  getClient,
} from "azure-devops-extension-api";
import { EnvironmentClient } from "./environment-client";
import { EnvironmentDetails } from "./environment-details";
import { Environment } from "./environment";

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
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filteredDeploymentRecords = deploymentRecords.filter(
      (d) => d.startTime > oneYearAgo
    );

    for (let j = 0; j < filteredDeploymentRecords.length; j++) {
      const key = filteredDeploymentRecords[j].definition.name;
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
        deploymentFrequency: convertQuantityToFrequency(value),
      });
    });
  }

  return result;
}

function convertQuantityToFrequency(quantity: number): string {
  if (quantity === 1) {
    return "Yearly";
  } else if (quantity === 2) {
    return "Every 6 months";
  } else if (quantity > 2 && quantity < 7) {
    return "Quarterly";
  } else if (quantity >= 7 && quantity < 27) {
    return "Monthly";
  } else if (quantity >= 27 && quantity < 156) {
    return "Weekly";
  } else if (quantity >= 156) {
    return "Daily";
  } else {
    return "Unknown";
  }
}
