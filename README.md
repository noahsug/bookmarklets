# Bookmarklets
> Various web bookmarklets


## Installation
1. Build the bookmarklet code
```sh
git clone git@github.com:noahsug/bookmarklets.git
cd bookmarklets
yarn
yarn build
ls bin # built bookmarklets are stored in bin/
```

2. Bookmark a bookmarklet
   1. Open Bookmark Manager (`option + command + B`)
   1. Options (triple dot in top right) -> Add new bookmark
   1. Enter a name
   1. Copy and paste the contents of `bookmarklets/bin/<your-bookmarklet>.js` as the URL
