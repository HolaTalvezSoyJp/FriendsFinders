import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});

interface AppConfig {
  searchRadiusMiles: number;
  inactivityTtlSeconds: number;
  locationUpdateIntervalSeconds: number;
  maxFriends: number;
  nearbyStrangersLimit: number;
}

const DEFAULTS: AppConfig = {
  searchRadiusMiles: 5,
  inactivityTtlSeconds: 600,
  locationUpdateIntervalSeconds: 30,
  maxFriends: 5000,
  nearbyStrangersLimit: 50,
};

const PARAM_PATHS = {
  searchRadiusMiles: process.env.SSM_SEARCH_RADIUS || '/nearby-friends/search-radius-miles',
  inactivityTtlSeconds: process.env.SSM_INACTIVITY_TTL || '/nearby-friends/inactivity-ttl-seconds',
  locationUpdateIntervalSeconds: process.env.SSM_LOCATION_UPDATE_INTERVAL || '/nearby-friends/location-update-interval-seconds',
  maxFriends: process.env.SSM_MAX_FRIENDS || '/nearby-friends/max-friends',
  nearbyStrangersLimit: process.env.SSM_NEARBY_STRANGERS_LIMIT || '/nearby-friends/nearby-strangers-limit',
};

let cachedConfig: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const command = new GetParametersCommand({
      Names: Object.values(PARAM_PATHS),
    });
    const response = await ssmClient.send(command);

    const paramMap = new Map<string, string>();
    for (const param of response.Parameters || []) {
      if (param.Name && param.Value) {
        paramMap.set(param.Name, param.Value);
      }
    }

    cachedConfig = {
      searchRadiusMiles: Number(paramMap.get(PARAM_PATHS.searchRadiusMiles)) || DEFAULTS.searchRadiusMiles,
      inactivityTtlSeconds: Number(paramMap.get(PARAM_PATHS.inactivityTtlSeconds)) || DEFAULTS.inactivityTtlSeconds,
      locationUpdateIntervalSeconds: Number(paramMap.get(PARAM_PATHS.locationUpdateIntervalSeconds)) || DEFAULTS.locationUpdateIntervalSeconds,
      maxFriends: Number(paramMap.get(PARAM_PATHS.maxFriends)) || DEFAULTS.maxFriends,
      nearbyStrangersLimit: Number(paramMap.get(PARAM_PATHS.nearbyStrangersLimit)) || DEFAULTS.nearbyStrangersLimit,
    };
  } catch {
    cachedConfig = { ...DEFAULTS };
  }

  return cachedConfig;
}
