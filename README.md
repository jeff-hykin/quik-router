# What is this?

Its the easiest tool for handling routing

# How do I use it?

`npm install quik-router`

```js
const router = require("quik-router")
//     router.pageInfo
//     router.goTo({})
//     router.goBack()
//     router.goSecretlyTo({})
//     router.addEventListener("go", (pageInfo)=>{ })
//     router.addEventListener("allChanges", (pageInfo)=>{ })


// 
// getter (all the info from the url)
// 
// reactive/always-up-to-date
router.pageInfo 

// 
// (silent) setter
// 
// NOTE: doesn't call the go listeners
// and doesn't save the previous page on history
router.pageInfo.pageNumber = 20 // reactive (updates the url automatically)


// 
// listener
// 
router.addEventListener("go", (pageInfo)=>{
    console.log("the page just changed!", pageInfo)
})


// 
// Go To
// 
// this calls the listener above, and allows user to go back to previous page
router.goTo({path: "some/location"})
// "path" is just an arbitrary key, use any key you want
router.goSecretlyTo({path: "other/location", page: 5, randomUrlData: "blah"})
// this^ 
//    1. doesn't save the previous page on history
//    2. doesn't call the go listener

// 
// Go Back
// 
// the pageInfo is automatically updated, and all the event listeners are called
router.goBack()



// 
// allChanges
// 
// basically use this for debugging or within-page changes
router.pageInfo.pageNumber += 1
router.addEventListener("allChanges", (pageInfo)=>{
    console.log("someone changed the pageInfo!", pageInfo)
})

```


# Contributing / Setup

Everything is detailed in the `documentation/setup.md`!