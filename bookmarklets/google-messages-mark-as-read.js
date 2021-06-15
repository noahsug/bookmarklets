const ORIGIN_REGEX = new RegExp('//messages.google.com');
if (!ORIGIN_REGEX.test(document.location.origin)) {
  alert(`Cannot run bookmarklet!\nURL should match "${ORIGIN_REGEX}"`);
  process.exit(1);
}

// milliseconds to wait after clicking on a message
const CLICK_DELAY = 500;
// milliseconds to wait after scrolling to an already loaded part of the page
const SCROLL_DELAY = 500;
// milliseconds to wait before giving up on loading more messages
const LOAD_DELAY = 3000;

const selectors = {
  unreadItem: '.text-content.unread',
  item: '.text-content',
};

async function iterate() {
  await markAllInViewAsRead();

  const items = selectAllOrError(selectors.item);
  await loadMoreItems(items);
  const newItems = selectAllOrError(selectors.item);

  // run until there are no new items to load
  if (newItems.length > items.length) {
    await iterate();
  }
}

function markAllInViewAsRead() {
  const unread = document.querySelectorAll(selectors.unreadItem);
  if (unread.length > 0) {
    console.log('marking', unread.length, 'messages as read');
  }

  const markAsUnreadJobs = [...unread].map((item) => {
    return async () => {
      item.click();
      await delay(CLICK_DELAY);
    };
  });

  return runSequentially(markAsUnreadJobs);
}

// new items are loaded by scrolling to the top and then scrolling back down to the bottom
async function loadMoreItems(items) {
  console.log('loading new messages...');

  const firstItem = items[0];
  firstItem.scrollIntoView();
  await delay(SCROLL_DELAY);

  const lastItem = items[items.length - 1];
  lastItem.scrollIntoView();
  await longPoll(checkForNewItems, { timeout: LOAD_DELAY });
}

async function checkForNewItems() {
  const items = selectAllOrError(selectors.item);
  await delay(100);
  const newItems = selectAllOrError(selectors.item);
  return newItems.length > items.length;
}

function selectAllOrError(selector) {
  const items = document.querySelectorAll(selector);
  if (items.length === 0) {
    throw new Error('unable to find', selector);
  }
  return items;
}

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function runSequentially(promises) {
  return promises.reduce((result, current) => {
    return result.then(current);
  }, Promise.resolve());
}

// calls a function over and over again until it returns true, or until the timeout
async function longPoll(fn, { timeout }) {
  const startTime = Date.now();

  const success = await fn();
  if (success) return true;

  const endTime = Date.now();

  const ellapsed = endTime - startTime + 1;
  if (ellapsed >= timeout) return false;

  await longPoll(fn, { timeout: timeout - ellapsed });
}

(async () => {
  const start = Date.now();
  await iterate();
  const end = Date.now();
  const seconds = (end - start) / 1000;
  console.log(`done in ${seconds.toFixed(1)}s`);
})();
