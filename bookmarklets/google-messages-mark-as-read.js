const ORIGIN_REGEX = new RegExp('//messages.google.com');
if (!ORIGIN_REGEX.test(document.location.origin)) {
  console.error('Cannot run bookmarklet! URL should match', ORIGIN_REGEX);
  process.exit(1);
}

// delay after clicking on a message
const CLICK_DELAY = 500;
// delay after scrolling to an already loaded part of the page
const SCROLL_DELAY = 500;
// delay after loading in new messages
const LOAD_DELAY = 2500;

const selectors = {
  unreadItem: '.text-content.unread',
  item: '.text-content',
};

async function iterate({ prevNumItems, loadCount } = { prevNumItems: 0, loadRetryCount: 0 }) {
  await markAllInViewAsRead();

  const items = selectAllOrError(selectors.item);

  // check if there are any more items to scroll to
  if (ite || loadCount < LOAD_ATTEMPTS) {
    console.log('loading new messages...', loadCount > 0 ? `(attempt ${loadCount + 1})` : '');
    await scrollInMoreItems(items);

    const newLoadCount = lastItem === prevLastItem && markedAsRead === 0 ? loadCount + 1 : 0;
    await iterate(lastItem, newLoadCount);
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

async function scrollInMoreItems(items) {
  const lastItem = items[items.length - 1];
  const firstItem = items[0];

  // we need to scroll away first otherwise the page won't load new messages
  firstItem.scrollIntoView();
  // nothing to load so we don't need to wait very long
  await delay(SCROLL_DELAY);

  lastItem.scrollIntoView();
  await delay(LOAD_DELAY);
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

(async () => {
  const start = Date.now();
  await iterate();
  const end = Date.now();
  const seconds = (end - start) / 1000;
  console.log(`done in ${seconds.toFixed(1)}s`);
})();
