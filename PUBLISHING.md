
# SDK Components release workflow

clone the repository in a new directory. I suggest creating folders for each repo/tagversion, under a *releases* directory.

```bash
git clone git@github.com:senzingiris/sdk-components-ng.git releases/sdk-components-ng/1.0.5
cd releases/sdk-components-ng/1.0.5
npm install
```

then start up the default example project w/
`npm start`. This will build the SDK using a fresh install, then start up a server on port 4300. Verify that things compile, run and are behaving as expected.

If things are missing or not behaving as expected *DO NOT PUBLISH* to npm or tag in github. Unpublishing a release is very difficult and in some cases impossible. You may have to update the package.json version(s) with a minor release number and try again.

If everything is functional proceed to generating updated documentation, building the npm package.
make sure you're at the root of the project, and type `npm run package`. This will generate the npm package directory and tar.gz file under `dist/@senzing/sdk-components-ng`. You may optionally install the tar.gz file as a dependency in another project locally that uses the SDK to be 100% sure that the version you're about to publish works as expected. Feel free to `cd ./dist/@senzing/sdk-components-ng/ && npm publish --access public` or `npm run publish` to publish to the npm registry at this point.

Now that you're still in the release staging branch cd back to the project root and do a `git status`, you will probably notice alot of new updates in the docs directory. This is updated documentation from running the `npm run package` build. If this is a major release you should absolutely create a pull request for merging this updated documentation back in the master branch of the repo. This way you have fresh up to date documentation for each release as the first commit following your release. If it's just something minor but had to be released publicly updating that docs may not be necessary.

At this point you should go in to the github repository page and tag a release with the appropriate version number and include any release notes.
