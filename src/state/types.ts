import * as DevOps from 'azure-devops-extension-sdk';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { IdentityRef } from 'azure-devops-extension-api/WebApi/WebApi';
import { WorkItem } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { IdentityRefWithVote, PullRequestStatus, GitRepository } from 'azure-devops-extension-api/Git/Git';

import { ReviewerVoteOption } from '../lib/enums';

const SET_REPOSITORIES = 'setRepositories';
const SET_PULL_REQUESTS = 'setPullRequests';
const SET_CURRENT_USER = 'setCurrentUser';
const ADD_ASYNC_TASK = 'addAsyncTask';
const REMOVE_ASYNC_TASK = 'removeAsyncTask';
const TOGGLE_FILTER_BAR = 'toggleFilterBar';
const DISPLAY_WORK_ITEMS = 'displayWorkItems';
const REFRESH_PULL_REQUESTS = 'refreshPullRequests';

export const ActionTypes = {
  SET_REPOSITORIES,
  SET_PULL_REQUESTS,
  SET_CURRENT_USER,
  ADD_ASYNC_TASK,
  REMOVE_ASYNC_TASK,
  TOGGLE_FILTER_BAR,
  DISPLAY_WORK_ITEMS,
  REFRESH_PULL_REQUESTS
} as const;

export interface PR {
  pullRequestId: number;
  repositoryId: string;
  isDraft: boolean;
  isAutoComplete: boolean;
  status: PullRequestStatus;

  title: string;
  href: string;
  createdBy: IdentityRef;
  creationDate: Date;
  secondaryTitle: string;

  sourceBranch: PRRef;
  targetBranch: PRRef;
  repository: PRRef;

  myApprovalStatus: ReviewerVoteOption;

  workItems: WorkItem[];
  reviewers: IdentityRefWithVote[];
}

type PRRef = { name: string; href: string };

export interface Data {
  repositories: GitRepository[];
  pullRequests: PR[];
  currentUser: DevOps.IUserContext;
  isFullScreenMode: boolean;
  asyncTaskCount: number;
}

export interface UI {
  isFilterVisible: ObservableValue<boolean>;
}

export interface PrHubState {
  data: Data;
  ui: UI;
}
