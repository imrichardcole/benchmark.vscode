1.  Commit all changes and push to remote repo
2.  Test that package builds ok - vsce package
3.  Publish the package as a minor version increment - vsce publish minor

N.B 3 requires a working token which can be accessed from the azure dev dashboard.

Once created you can access this before running step 3 like so:

    vsce login <publisher_id>