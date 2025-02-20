// Delete next N numer of tweets by giving Element Ref of 
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function removeTweet(tweet){
    const tweetOptions = tweet.querySelector('[aria-label="More"]').click();
    await sleep(500);
    const dropdownOptions = [...document.querySelectorAll('[role="menuitem"]')];
    const deleteButton = dropdownOptions.filter(el => el.innerText === "Delete")[0]
    console.log(deleteButton);
    deleteButton.click();
    await sleep(500);
    document.querySelector('[data-testid="confirmationSheetConfirm"]').click();
    await sleep(500);
};
let count = 0;
async function deleteNextXPost(firstPost, counts){
    if(count === counts) return
    await removeTweet(firstPost);
    firstPost = firstPost?.nextElementSibling;
    count += 1;
    deleteNextXPost(firstPost, counts);
}
await deleteNextXPost($0, 9);
