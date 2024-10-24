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

const SEMESTERLY = 2;

// Monday to Friday
const YEARLY_BUSINESS_DAYS = 261;

// Half months in a year + 1
const MOST_MONTHS = 7;

// Half weeks in a year + 1
const MOST_WEEKS = 27;

// At least 3 times a week = 52 (weeks in a year) * 3 (days in a week)
const MOST_DAYS = 156;

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

  return environments.value;
}

export async function getDeploymentRecords(
  environments: Environment[]
): Promise<EnvironmentDetails[]> {
  const projectId = await getCurrentProjectId();

  const result: EnvironmentDetails[] = [];

  for (let environment of environments) {
    const allEnvRecords: EnvironmentDeploymentRecord[] = [];
    let records = await getClient(EnvironmentClient).getAllDeploymentRecords(
      projectId!,
      environment.id
    );
    allEnvRecords.push(...records.value);

    while (records.continuationToken !== null) {
      records = await getClient(EnvironmentClient).getAllDeploymentRecords(
        projectId!,
        environment.id,
        records.continuationToken
      );
      allEnvRecords.push(...records.value);
    }

    const map = new Map<string, { count: number; piplineUrl: string }>();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filteredDeploymentRecords = allEnvRecords.filter((d) => {
      return new Date(d.startTime) > oneYearAgo && d.result === "succeeded";
    });

    for (let j = 0; j < filteredDeploymentRecords.length; j++) {
      const key = filteredDeploymentRecords[j].definition.name;
      const currentValue = map.get(key);
      if (currentValue) {
        map.set(key, { ...currentValue, count: currentValue.count + 1 });
      } else {
        map.set(key, {
          count: 1,
          piplineUrl: filteredDeploymentRecords[j].definition._links.web.href,
        });
      }
    }

    map.forEach((value, key) => {
      const average = YEARLY_BUSINESS_DAYS / value.count;
      result.push({
        name: key,
        environmentName: environment.name,
        deploymentRecordCount: value.count,
        deploymentFrequency: convertQuantityToFrequency(value.count),
        pipelineUrl: value.piplineUrl,
        average: parseFloat(average.toFixed(1)),
      });
    });
  }

  return result;
}

function convertQuantityToFrequency(quantity: number): string {
  if (quantity === 1) {
    return "Yearly";
  } else if (quantity === SEMESTERLY) {
    return "Every 6 months";
  } else if (quantity > SEMESTERLY && quantity < MOST_MONTHS) {
    return "Quarterly";
  } else if (quantity >= MOST_MONTHS && quantity < MOST_WEEKS) {
    return "Monthly";
  } else if (quantity >= MOST_WEEKS && quantity < MOST_DAYS) {
    return "Weekly";
  } else if (quantity >= MOST_DAYS) {
    return "Daily";
  } else {
    return "Unknown";
  }
}
