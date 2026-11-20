import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import type { AnnouncementState } from '../types/announcement';
import {
  APIKEY_FUN_CAMPAIGN,
  filterApiKeyFunCampaignAnnouncement,
  isApiKeyFunCampaignActive,
} from './apiKeyFunCampaign.ts';
import { APIKEY_FUN_REGISTER_URL, normalizeApiKeyFunOfficialUrl } from './apikeyFunLinks.ts';

test('Clean never activates the upstream promotion', () => {
  assert.equal(isApiKeyFunCampaignActive(), false);
});

test('cached campaign announcement and unread badge disappear outside the period without mutating other notices', () => {
  const notice = (id: string) => ({ id, type: 'info', title: id, summary: '', content: '', priority: 1, targetVersions: '*', popup: false, createdAt: APIKEY_FUN_CAMPAIGN.startsAt });
  const campaign = notice(APIKEY_FUN_CAMPAIGN.id);
  const other = notice('other');
  const state: AnnouncementState = { announcements: [campaign, other], unreadIds: [campaign.id, other.id], popupAnnouncement: campaign };
  assert.equal(filterApiKeyFunCampaignAnnouncement(state, true), state);
  assert.deepEqual(filterApiKeyFunCampaignAnnouncement(state, false), { announcements: [other], unreadIds: [other.id], popupAnnouncement: null });
  assert.equal(state.announcements.length, 2);
  assert.equal(filterApiKeyFunCampaignAnnouncement({ ...state, popupAnnouncement: other }, false).popupAnnouncement, other);
});

test('Clean announcement feed excludes the campaign and uses a referral-free provider link', () => {
  const feed = JSON.parse(readFileSync(new URL('../../announcements.json', import.meta.url), 'utf8'));
  assert.ok(feed.announcements.every((item: { id: string }) => item.id !== APIKEY_FUN_CAMPAIGN.id));
  assert.equal(new URL(APIKEY_FUN_CAMPAIGN.url).searchParams.has('aff'), false);
  assert.equal(normalizeApiKeyFunOfficialUrl('https://apikey.fan/register'), APIKEY_FUN_REGISTER_URL);
});
