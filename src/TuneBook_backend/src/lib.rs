mod utils;
mod types;
use crate::types::{Forum, ForumData};


#[ic_cdk::init]
fn init(time: u64) {
    ic_cdk::spawn(async {
        utils::init().await;  
    });

    ic_cdk_timers::set_timer(std::time::Duration::from_secs(time), || {
        ic_cdk::spawn(update_data())
    });
}

#[ic_cdk::post_upgrade]
fn post_upgrade(time: u64) {
    ic_cdk::spawn(async {
        utils::init().await;  
    });
    init(time);
}


#[ic_cdk::update]
async fn update_data() {
    utils::init().await
}

#[ic_cdk::query]
fn authentication(principal: String) -> Option<types::Profile> {
    utils::authentication(principal)
}

#[ic_cdk::update]
async fn update_profile(principal: String, username: String, pob: String, instruments: String, bio: Option<String>, avatar: Vec<u8>) -> types::Profile {
    utils::update_profile(principal, username, pob, instruments, bio, avatar).await
}

#[ic_cdk::query]
fn get_original_tune_list(principal: String, page_number: i32) -> (Vec<String>, i32) {
    utils::get_original_tune_list(principal, page_number)
}

#[ic_cdk::query]
fn get_original_tune(title: String) -> String {
    utils::get_original_tune(title)
}

#[ic_cdk::query]
fn get_user_tune_list(principal: String, page_number: i32) -> (Vec<types::Tuneinfo>, i32) {
    utils::get_user_tune_list(principal, page_number)
}

#[ic_cdk::query]
fn get_user_tune(principal: String, title: String) -> String {
    utils::get_user_tune(principal, title)
}

#[ic_cdk::update]
async fn add_tune(principal: String, title: String, tune_data: String, origin: bool, username: Option<String>) -> bool {
    utils::add_tune(principal, title, tune_data, origin, username).await
}

#[ic_cdk::update]
async fn update_tune(principal: String, title: String, tune_data: String, origin: bool, username: Option<String>) -> bool {
    utils::update_tune(principal, title, tune_data, origin, username).await
}

#[ic_cdk::query]
pub fn get_friends(principal: String) -> Vec<types::Friend> {
    utils::get_friends(principal)
}

#[ic_cdk::update]
pub async fn send_friend_request(sender: String, receiver: String) -> Option<types::Friend> {
    utils::send_friend_request(sender, receiver).await
}

#[ic_cdk::update]
pub async fn accept_friend_request(sender: String, receiver: String) -> bool {
    utils::accept_friend_request(sender, receiver).await
}

#[ic_cdk::update]
pub async fn cancel_friend_request(sender: String, receiver: String) -> bool {
    utils::cancel_friend_request(sender, receiver).await
}


#[ic_cdk::query]
pub fn filter_tunes(title:String, rithm: String, key: String, page_num: i32) -> (Vec<types::Tuneinfo>, i32) {
    utils::filter_tunes(title.as_str(), rithm.as_str(), key.as_str(), page_num)
}

#[ic_cdk::query]
pub fn browse_people(principal: String, filter: String, page_num:i32) -> (Vec<types::Friend>, i32) {
    utils::browse_people(principal, filter, page_num)
}

#[ic_cdk::query]
pub fn get_new_tunes_from_friends(principal: String) -> Vec<types::Tune> {
    utils::get_new_tunes_from_friends(principal)
}

#[ic_cdk::query]
pub fn get_sessions(sub_name: String, page_num: i32) -> (Vec<types::Session>, i32) {
    utils::get_sessions(sub_name.as_str(), page_num)
}

#[ic_cdk::update]
pub fn add_session(principal: String, username: String, name: String, location: String, daytime: String, contact: String, comment: String, recurring: String) -> bool {
    utils::add_session(principal, username, name, location, daytime, contact, comment, recurring)
}

#[ic_cdk::update]
pub fn update_session(id: u32, principal: String, username: String, name: String, location: String, daytime: String, contact: String, comment: String, recurring: String) -> bool {
    utils::update_session(id, principal, username, name, location, daytime, contact, comment, recurring)
}

#[ic_cdk::update]
pub fn delete_session(id: u32, principal: String) -> bool {
    utils::delete_session(id, principal)
}

#[ic_cdk::query]
pub fn get_profile(principal: String) -> Option<types::Profile> {
    utils::get_profile(principal)
}

#[ic_cdk::update]
pub fn remove_tune(principal: String, title: String) -> bool {
    utils::remove_tune(principal, title)
}

#[ic_cdk::query]
pub fn get_instruments(sub_name: String, page_num: i32) -> (Vec<types::Instrument>, i32) {
    utils::get_instruments(sub_name.as_str(), page_num)
}

#[ic_cdk::update]
pub fn add_instrument(seller_principal: String, buyer_principal: String, username: String, name: String, location: String, product: String, comment: String, price: String, photos: Vec<Vec<u8>>) -> bool {
    utils::add_instrument(seller_principal, buyer_principal, username, name, location, product, comment, price, photos)
}

#[ic_cdk::update]
pub fn delete_instrument(id: u32, seller_principal: String) -> bool {
    utils::delete_instrument(id, seller_principal)
}

#[ic_cdk::query]
fn get_profile_count() -> u64 {
    utils::get_profile_count()
}

#[ic_cdk::query]
fn get_tune_count() -> u64 {
    utils::get_tune_count()
}

#[ic_cdk::query]
fn get_session_count() -> u64 {
    utils::get_session_count()
}


#[ic_cdk::query]
pub fn get_forums(search_term: String, page_num: i32) -> (Vec<types::Forum>, i32) {
    utils::get_forums(search_term.as_str(), page_num)
}


#[ic_cdk::update]
pub fn delete_forum(forum_id: u64, principal: String) -> bool {
    utils::delete_forum(forum_id, principal)
}

#[ic_cdk::update]
pub fn delete_post(post_id: u64, principal: String) -> bool {
    utils::delete_post(post_id, principal)
}

#[ic_cdk::update]
pub fn update_forum_post(
    post_id: u64,
    principal: String,
    comment: Option<String>,
    photos: Option<Vec<Vec<u8>>>,
) -> bool {
    utils::update_forum_post(post_id, principal, comment, photos)
}


#[ic_cdk::update]
pub fn add_post_to_forum(
    forum_id: u64,
    username: String,
    principal: String,
    comment: String,
    photos: Option<Vec<Vec<u8>>>
) -> bool {
    utils::add_post_to_forum(forum_id, username, principal, comment, photos)
}


#[ic_cdk::update]
pub fn add_forum(
    principal: String,
    username: String,
    forum_name: String,
    comment: String,
) -> bool {
    utils::add_forum(principal, username, forum_name, comment)
}


#[ic_cdk::query] 
pub fn get_forum_posts(forum_id: u64, page_num: i32) -> (Vec<ForumData>, i32) {
    utils::get_forum_posts(forum_id, page_num).expect("REASON")
}

#[ic_cdk::query] 
pub fn get_forum_posts_without_photos(forum_id: u64, page_num: i32) -> (Vec<ForumData>, i32) {
    utils::get_forum_posts_without_photos(forum_id, page_num)
}
