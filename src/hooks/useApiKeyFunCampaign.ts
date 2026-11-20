import { isApiKeyFunCampaignActive } from '../utils/apiKeyFunCampaign';

export function useApiKeyFunCampaign(): boolean {
  return isApiKeyFunCampaignActive();
}
