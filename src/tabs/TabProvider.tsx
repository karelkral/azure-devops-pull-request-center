import * as React from 'react';
import { Dispatch } from 'redux';
import { useSelector, useDispatch } from 'react-redux';

import { Draft } from './Draft';
import { Active } from './Active';
import { Page } from 'azure-devops-ui/Page';
import { Header } from 'azure-devops-ui/Header';
import { Surface } from 'azure-devops-ui/Surface';
import { TabBar, Tab } from 'azure-devops-ui/Tabs';
import { RecentlyCompleted } from './RecentlyCompleted';
import { ObservableArray } from 'azure-devops-ui/Core/Observable';
import { FILTER_CHANGE_EVENT, Filter } from 'azure-devops-ui/Utilities/Filter';
import { IHeaderCommandBarItem, HeaderCommandBarWithFilter } from 'azure-devops-ui/HeaderCommandBar';

import { filter } from '..';
import { applyFilter } from '../lib/filters';
import { PrHubState, PR, TabOptions } from '../state/types';
import { SettingsPanel } from '../components/SettingsPanel';
import { fromPRToFilterItems } from '../state/transformData';
import {
  setSelectedTab,
  setPullRequests,
  toggleSettingsPanel,
  toggleSortDirection,
  triggerSortDirection,
} from '../state/actions';
import { ITab, ActiveItemProvider, FilterItemsDictionary, FilterDictionary, FilterOptions } from './TabTypes';
import { useUnmount } from '../lib/utils';

export const getCurrentFilterValues: (filter: Filter) => FilterDictionary = filter => {
  return {
    searchString: filter.getFilterItemValue<string>(FilterOptions.searchString),
    repositories: filter.getFilterItemValue<string[]>(FilterOptions.repositories),
    sourceBranch: filter.getFilterItemValue<string[]>(FilterOptions.sourceBranch),
    targetBranch: filter.getFilterItemValue<string[]>(FilterOptions.targetBranch),
    author: filter.getFilterItemValue<string[]>(FilterOptions.author),
    reviewer: filter.getFilterItemValue<string[]>(FilterOptions.reviewer),
    myApprovalStatus: filter.getFilterItemValue<string[]>(FilterOptions.myApprovalStatus),
  };
};

const setCurrentFilterValues = (filter: Filter, savedFilterItems: FilterDictionary | undefined) => {
  filter.setState({
    [FilterOptions.searchString]: { value: savedFilterItems?.searchString },
    [FilterOptions.repositories]: { value: savedFilterItems?.repositories },
    [FilterOptions.sourceBranch]: { value: savedFilterItems?.sourceBranch },
    [FilterOptions.targetBranch]: { value: savedFilterItems?.targetBranch },
    [FilterOptions.author]: { value: savedFilterItems?.author },
    [FilterOptions.reviewer]: { value: savedFilterItems?.reviewer },
    [FilterOptions.myApprovalStatus]: { value: savedFilterItems?.myApprovalStatus },
  });
};

const onFilterChanges = (store: PrHubState) => {
  filter.subscribe(() => {
    if (store.data.pullRequests.length > 0) {
      pullRequestItemProvider$.splice(0, pullRequestItemProvider$.length);
      pullRequestItemProvider$.push(
        ...applyFilter(store.data.pullRequests, getCurrentFilterValues(filter), store.ui.selectedTab),
      );
      triggerSortDirection();
    }
  }, FILTER_CHANGE_EVENT);
};

const getCommandBarItems = (dispatch: Dispatch<any>): IHeaderCommandBarItem[] => {
  return [
    {
      id: 'refresh',
      text: 'Refresh',
      isPrimary: true,
      important: true,
      onActivate: () => {
        dispatch(setPullRequests());
      },
      iconProps: {
        iconName: 'fabric-icon ms-Icon--Refresh',
      },
    },
    {
      id: 'open-prefs',
      important: true,
      subtle: true,
      onActivate: () => {
        dispatch(toggleSettingsPanel());
      },
      iconProps: {
        iconName: 'fabric-icon ms-Icon--Settings',
      },
    },
  ];
};

const getFilterCommandBarItems = (dispatch: Dispatch<any>, store: PrHubState): IHeaderCommandBarItem[] => {
  return [
    {
      id: 'sort-direction',
      text: store.ui.sortDirection === 'desc' ? 'Newest' : 'Oldest',
      tooltipProps: {
        text: 'Sorting by',
        delayMs: 1000,
      },
      important: true,
      subtle: true,
      onActivate: () => {
        dispatch(toggleSortDirection());
      },
      iconProps: {
        iconName: store.ui.sortDirection === 'desc' ? 'SortDown' : 'SortUp',
      },
    },
  ];
};

const getPageContent = ({ newSelectedTab, filterItems, store }: { newSelectedTab: TabOptions } & ITab) => {
  const tabs: Record<TabOptions, JSX.Element> = {
    active: <Active filterItems={filterItems} store={store} />,
    draft: <Draft filterItems={filterItems} store={store} />,
    recentlyCompleted: <RecentlyCompleted filterItems={filterItems} store={store} />,
  };
  return tabs[newSelectedTab];
};

const badgeCount: (pullRequests: PR[], selectedTab: TabOptions) => number | undefined = (
  pullRequests: PR[],
  selectedTab: TabOptions,
) => {
  if (pullRequests.length === 0) {
    return undefined;
  }

  if (selectedTab === 'active') {
    const activePrsCount = pullRequests.filter(v => v.isActive).length;
    return activePrsCount > 0 ? activePrsCount : undefined;
  }

  if (selectedTab === 'draft') {
    const draftPrsCount = pullRequests.filter(v => v.isDraft).length;
    return draftPrsCount > 0 ? draftPrsCount : undefined;
  }

  if (selectedTab === 'recentlyCompleted') {
    const completedPrsCount = pullRequests.filter(v => v.isCompleted).length;
    return completedPrsCount > 0 ? completedPrsCount : undefined;
  }
};

export const pullRequestItemProvider$ = new ObservableArray<ActiveItemProvider>();
export const TabProvider: React.FC = () => {
  const store = useSelector((store: PrHubState) => store);
  const dispatch = useDispatch();
  const [filterItems, setFilterItems] = React.useState<FilterItemsDictionary>({
    repositories: [],
    sourceBranch: [],
    targetBranch: [],
    author: [],
    reviewer: [],
    myApprovalStatus: [],
  });
  onFilterChanges(store);

  React.useEffect(() => {
    if (store.data.pullRequests.length > 0) {
      pullRequestItemProvider$.splice(0, pullRequestItemProvider$.length);
      pullRequestItemProvider$.push(
        ...applyFilter(store.data.pullRequests, getCurrentFilterValues(filter), store.ui.selectedTab),
      );
      setFilterItems(
        fromPRToFilterItems(applyFilter(store.data.pullRequests, getCurrentFilterValues(filter), store.ui.selectedTab)),
      );
      setCurrentFilterValues(filter, store.settings.defaults.filterValues);
      triggerSortDirection();
    }
  }, [store.data.pullRequests, store.ui.selectedTab, store.settings.defaults.filterValues, dispatch]);

  useUnmount(() => {
    filter.unsubscribe(() => ({}), FILTER_CHANGE_EVENT);
  });

  return (
    <Surface background={1}>
      <Page className="azure-pull-request-hub flex-grow">
        <Header title={'Pull Requests Center'} titleSize={1} commandBarItems={getCommandBarItems(dispatch)} />
        <TabBar
          selectedTabId={store.ui.selectedTab}
          onSelectedTabChanged={newSelectedTab => dispatch(setSelectedTab(newSelectedTab))}
          tabSize={'tall' as any}
          renderAdditionalContent={() => (
            <HeaderCommandBarWithFilter
              filter={filter}
              items={getFilterCommandBarItems(dispatch, store)}
              filterToggled={store.ui.isFilterVisible}
            />
          )}
        >
          <Tab name="Active" id="active" badgeCount={badgeCount(store.data.pullRequests, 'active')} />
          <Tab name="Draft" id="draft" badgeCount={badgeCount(store.data.pullRequests, 'draft')} />
          <Tab
            name="Completed"
            id="recentlyCompleted"
            badgeCount={badgeCount(store.data.pullRequests, 'recentlyCompleted')}
          />
        </TabBar>
        <div className="page-content-left page-content-right page-content-top page-content-bottom">
          {getPageContent({ newSelectedTab: store.ui.selectedTab, filterItems, store })}
        </div>
      </Page>
      {store.settings.settingsPanelOpen && <SettingsPanel />}
    </Surface>
  );
};
