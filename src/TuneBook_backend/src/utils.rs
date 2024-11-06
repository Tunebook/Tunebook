use ic_cdk;
use crate::types;
use candid::{Decode, Encode};
use serde_json::Value;
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::BTreeMap;
use regex::Regex;
use crate::utils::ic_cdk::api;
use std::borrow::Borrow;

    
const TUNE_DB_INIT: &str = include_str!("./tune_db_converted.json");



use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};

type Memory = VirtualMemory<DefaultMemoryImpl>;

type ProfileStore = StableBTreeMap<String, types::Profile, Memory>;
type TuneDB = StableBTreeMap<String, types::Tune, Memory>;
type SessionDB = StableBTreeMap<u32, types::Session, Memory>;


impl Storable for types::Profile {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2000000, // Replace with the actual max size
        is_fixed_size: false,
    };
}


impl Storable for types::Tune {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2000000, // Replace with the actual max size
        is_fixed_size: false,
    };
}

impl Storable for types::Session {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
    
    const BOUND: Bound = Bound::Bounded {
        max_size: 2000000, // Replace with the actual max size
        is_fixed_size: false,
    };
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    pub static PROFILE_STORE: RefCell<ProfileStore> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
    ));

    pub static TUNE_STORE: RefCell<TuneDB> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
    ));

    pub static SESSION_STORE: RefCell<SessionDB> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
    ));
}



// Initialize tunes from tune_db.json
pub async fn init() {
    ic_cdk::setup();

    ic_cdk::println!("Initializing tunes from tune_db.json");

    let parsed: Value = serde_json::from_str(TUNE_DB_INIT).expect("Failed to parse JSON");

    TUNE_STORE.with(|tune_store| {
        if tune_store.borrow().is_empty() {
            if let Value::Object(ref tunes) = parsed {
                let mut count = 0;
                for (key, value) in tunes {
                    let tune_data = value.as_str().unwrap().to_string();
                    let new_tune = types::Tune {
                        origin: true,
                        title: key.clone(),
                        tune_data: tune_data.clone(),
                        timestamp: api::time(),
                        principals: vec![],
                    };
                    tune_store.borrow_mut().insert(key.clone(), new_tune);
                    count += 1;  // Count the number of tunes processed
                }
                ic_cdk::println!("Successfully loaded {} tunes into the canister", count);
            } else {
                ic_cdk::println!("Error: tune_db.json is not in the expected format");
            }
        } else {
            ic_cdk::println!("Tunes already loaded, skipping initialization");
        }
    });
    
}

pub fn authentication(principal: String) -> Option<types::Profile> {
    PROFILE_STORE.with(|profile_store| {
        if profile_store.borrow().get(&principal).is_some() {
            Some(profile_store.borrow().get(&principal).unwrap().clone())
        } else {
            None
        }
    })
}


pub async fn update_profile(
    principal: String,
    username: String,
    pob: String,
    instruments: String,
    bio: Option<String>,
    avatar: Vec<u8>,
) -> types::Profile {
    PROFILE_STORE.with(|profile_store| {
        let store = profile_store.borrow();

        // Check for username uniqueness
        if store.iter().any(|(_, profile)| profile.username == username && profile.principal != principal) {
            panic!("Username '{}' is already taken", username); // You can handle this differently
        }
        
        drop(store);

        // If profile exists, update it
        if profile_store.borrow().get(&principal).is_some() {

            let mut new_profile = profile_store.borrow().get(&principal).unwrap().clone();

            new_profile.username = username;
            new_profile.avatar = avatar;
            new_profile.pob = pob;
            new_profile.instruments = instruments;
            new_profile.bio = bio;
            profile_store.borrow_mut().insert(principal, new_profile.clone());

            println!("Created new profile for principal: ");
            new_profile
        } else {
            // Otherwise, create a new profile
            let new_profile = types::Profile {
                principal: principal.clone(),
                username,
                avatar,
                pob,
                instruments,
                bio,
                friends: vec![],
                incoming_fr: vec![],
                outcoming_fr: vec![],
            };
            profile_store.borrow_mut().insert(principal, new_profile.clone());

            println!("Created new profile for principal: ");
            new_profile
        }
    }
)}





// Function to get a paginated list of original tunes
pub fn get_original_tune_list(page_number: i32) -> (Vec<String>, i32) {
    TUNE_STORE.with(|tune_store| {
        let tunes: Vec<String> = tune_store
            .borrow()
            .iter()  // Iterate over the BTreeMap's (key, value) pairs
            .skip((page_number * 15) as usize)
            .take(15)
            .map(|(_, tune)| tune.title.clone())  // Map over the values and extract the title
            .collect();
        
        let total_count = tune_store.borrow().len() as i32;  // Get the total count of tunes
        (tunes, total_count)
    })
}
    

pub fn get_original_tune(title: String) -> String {
    TUNE_STORE.with(|tune_store| {
        if let Some(tune) = tune_store.borrow().get(&title) {
            tune.tune_data.clone()  // Return the tune's data
        } else {
            "Tune not found".to_string()  // Handle missing tunes
        }
    })
}


pub fn get_user_tune_list(principal: String, page_number: i32) -> (Vec<types::Tuneinfo>, i32) {
    TUNE_STORE.with(|tune_store| {
        let user_tunes: Vec<types::Tuneinfo> = tune_store
            .borrow()
            .iter()
            .filter(|(_, tune_info)| tune_info.principals.contains(&principal))
            .map(|(_, tune_info)| {
                let user_tune = types::Tuneinfo {
                    title: tune_info.title.clone(),
                    tune_data: tune_info.tune_data.clone()
                };
                user_tune
            })
            .collect();

            if page_number == -1 {
                return (user_tunes.clone(), user_tunes.len() as i32);
            }

            let res = user_tunes
                .iter()
                .skip(page_number as usize * 8)
                .enumerate()
                .filter(|(index, _)| index.clone() < 8)
                .map(|(_, tune_info)| tune_info.clone())
                .collect();

            return (res, user_tunes.len() as i32);
    })
}

pub fn get_user_tune(principal: String, title: String) -> String {
    TUNE_STORE.with(|tune_store| {
        let user_tune = tune_store
            .borrow()
            .get(&title)
            .unwrap()
            .clone();
        
        if user_tune.principals.contains(&principal) {
            user_tune.tune_data.clone()
        } else {
            String::new()
        }
    })
}


pub async fn add_tune(
    principal: String,
    title: String,
    tune_data: String,
    origin: bool,
) -> bool {
    TUNE_STORE.with(|tune_store| {
        let mut principals: Vec<String> = vec![];
        if tune_store.borrow().get(&title).is_some() {
            let prev_tune = tune_store.borrow().get(&title).unwrap().clone();
            if prev_tune.principals.contains(&principal) {
                return false;
            }

            principals = prev_tune.principals;
        }

        principals.push(principal);

        let new_tune = types::Tune {
            origin,
            title,
            tune_data,
            timestamp: ic_cdk::api::time(),
            principals
        };
        tune_store.borrow_mut().insert(new_tune.title.clone(), new_tune);
        true
    })
}



pub async fn update_tune(
    principal: String,
    title: String,
    tune_data: String,
    origin: bool,
) -> bool {
    TUNE_STORE.with(|tune_store| {
        if tune_store.borrow().get(&title).is_none() {
            return false;
        }
        let prev_tune = tune_store.borrow().get(&title).unwrap().clone();
        if !prev_tune.principals.contains(&principal) {
            return false;
        }

        let updated_tune = types::Tune {
            origin,
            title,
            tune_data,
            timestamp: ic_cdk::api::time(),
            principals: prev_tune.principals
        };
        tune_store.borrow_mut().insert(updated_tune.title.clone(), updated_tune);
        true
    })
}
    

pub fn get_friends(principal: String) -> Vec<types::Friend> {
    PROFILE_STORE.with(|profile_store| {
        let binding = profile_store.borrow();
        if binding.get(&principal).is_some() {
            let friend_principals = profile_store
                .borrow()
                .get(&principal)
                .unwrap()
                .friends
                .clone();
            let result: Vec<types::Friend> = friend_principals
                .iter()
                .map(|friend_principal| {
                    let friend_profile = binding.get(friend_principal).unwrap();
                    let friend = types::Friend {
                        principal: friend_principal.clone(),
                        avatar: friend_profile.avatar.clone(),
                        username: friend_profile.username.clone(),
                    };
                    friend
                })
                .collect();
            result
        } else {
            vec![]
        }
    })
}

pub fn get_profile(principal: String) -> Option<types::Profile> {
    PROFILE_STORE.with(|profile_store| {
        if let Some(profile) = profile_store.borrow().get(&principal) {
            ic_cdk::println!("Profile found for principal: {}", principal); // Log the success
            Some(profile.clone()) // Return the profile if it exists
        } else {
            ic_cdk::println!("No profile found for principal: {}", principal); // Log the failure
            None // Return None if no profile exists
        }
    })
}



pub async fn send_friend_request(sender: String, receiver: String) -> Option<types::Friend> {
    PROFILE_STORE.with(|profile_store| {
        let mut binding = profile_store.borrow_mut();
        if binding.get(&sender).is_some() && binding.get(&receiver).is_some() {
            let mut sender_profile = binding.get(&sender).unwrap().clone();
            let mut receiver_profile = binding.get(&receiver).unwrap().clone();

            let outcoming_principals: Vec<String> = sender_profile.outcoming_fr
                .iter()
                .map(|friend| friend.principal.clone())
                .collect();

            let incoming_principals: Vec<String> = sender_profile.incoming_fr
                .iter()
                .map(|friend| friend.principal.clone())
                .collect();
            
            if sender_profile.friends.contains(&receiver) || outcoming_principals.contains(&receiver) || incoming_principals.contains(&receiver) {
                return None;
            }

            let incoming_request = types::Friend {
                principal: sender.clone(),
                username: sender_profile.username.clone(),
                avatar: sender_profile.avatar.clone(),
            };
            let outcoming_request = types::Friend {
                principal: receiver.clone(),
                username: receiver_profile.username.clone(),
                avatar: receiver_profile.avatar.clone(),
            };
            sender_profile.outcoming_fr.push(outcoming_request.clone());
            receiver_profile.incoming_fr.push(incoming_request);
            binding.insert(sender, sender_profile);
            binding.insert(receiver, receiver_profile);
            Some(outcoming_request)
        } else {
            None
        }
    })
}


pub async fn accept_friend_request(sender: String, receiver: String) -> bool {
    PROFILE_STORE.with(|profile_store| {
        let mut binding = profile_store.borrow_mut();
        if binding.get(&sender).is_some() && binding.get(&receiver).is_some() {
            let mut sender_profile = binding.get(&sender).unwrap().clone();
            let mut receiver_profile = binding.get(&receiver).unwrap().clone();
            let in_position = sender_profile
                .incoming_fr
                .iter()
                .position(|ifr| ifr.principal == receiver.clone());
            if in_position.is_some() {
                sender_profile.incoming_fr.remove(in_position.unwrap());
            }
            let out_position = receiver_profile
                .outcoming_fr
                .iter()
                .position(|ofr| ofr.principal == sender.clone());
            if out_position.is_some() {
                receiver_profile.outcoming_fr.remove(out_position.unwrap());
            }

            sender_profile.friends.push(receiver.clone());
            receiver_profile.friends.push(sender.clone());
            binding.insert(sender, sender_profile);
            binding.insert(receiver, receiver_profile);
            true
        } else {
            false
        }
    })
}


pub async fn cancel_friend_request(sender: String, receiver: String) -> bool {
    PROFILE_STORE.with(|profile_store| {
        let mut binding = profile_store.borrow_mut();

        // Safely extract sender and receiver profiles
        if binding.get(&sender).is_some() && binding.get(&receiver).is_some() {
            let mut sender_profile = binding.get(&sender).unwrap().clone();
            let mut receiver_profile = binding.get(&receiver).unwrap().clone();
        
            // Remove the outgoing request from the sender's profile
            if let Some(out_position) = sender_profile
                .outcoming_fr
                .iter()
                .position(|fr| fr.principal == receiver)
            {
                sender_profile.outcoming_fr.remove(out_position);
            } else {
                return false;  // Outgoing request not found
            }

            // Remove the incoming request from the receiver's profile
            if let Some(in_position) = receiver_profile
                .incoming_fr
                .iter()
                .position(|fr| fr.principal == sender)
            {
                receiver_profile.incoming_fr.remove(in_position);
            } else {
                return false;  // Incoming request not found
            }

            // Save the updated profiles
            binding.insert(sender.clone(), sender_profile);
            binding.insert(receiver.clone(), receiver_profile);

            return true;  // Successfully cancelled the request
        }
        
        false  // Either sender or receiver profile not found
    })
}

/*
pub fn filter_tunes(
    sub_title: &str,
    rithm: &str,
    key: &str,
    batch_start_index: i32,
    batch_size: i32,
) -> (Vec<types::Tuneinfo>, i32) {
    TUNE_STORE.with(|tune_store| {
        let binding = tune_store.borrow();
        let total_count: i32 = binding.len().try_into().unwrap_or(0);

        // Prepare regexes for rhythm and key matching only if they are not set to "all"
        let rhythm_regex = if rithm != "all" {
            Some(Regex::new(&format!(r"(?m)^R:\s*{}", rithm)).unwrap())
        } else {
            None
        };

        let key_regex = if key != "all" {
            Some(Regex::new(&format!(r"(?m)^K:\s*{}", key)).unwrap())
        } else {
            None
        };

        // Convert batch parameters to `usize` for indexing
        let start_index = batch_start_index;
        let size = batch_size;

        // Paginate first, and filter only the current batch
        let tunes: Vec<types::Tuneinfo> = binding
            .iter()
            .skip(start_index)  // Start from the specified batch index
            .take(size)          // Limit to the batch size
            .filter(|(_, tune_info)| {
                // Title filter
                let title_match = tune_info.title.to_lowercase().contains(&sub_title.to_lowercase());
                
                // Rhythm filter
                let rhythm_match = if let Some(ref regex) = rhythm_regex {
                    regex.is_match(&tune_info.tune_data)
                } else {
                    true
                };

                // Key filter
                let key_match = if let Some(ref regex) = key_regex {
                    regex.is_match(&tune_info.tune_data)
                } else {
                    true
                };

                // Apply all filters
                title_match && rhythm_match && key_match
            })
            .map(|(_, tune_info)| types::Tuneinfo {
                title: tune_info.title.clone(),
                tune_data: tune_info.tune_data.clone(),
            })
            .collect();

        // Return filtered tunes and the total count of all tunes in the store for pagination purposes
        (tunes, total_count)
    })
}

*/


pub fn filter_tunes(
    sub_title: &str,
    rithm: &str,
    key: &str,
    page_num: i32,
) -> (Vec<types::Tuneinfo>, i32) {
    const ITEMS_PER_PAGE: usize = 15;
    const BATCH_SIZE: usize = 100; // Process in batches of 100 items at a time

    TUNE_STORE.with(|tune_store| {
        let binding = tune_store.borrow();
        let total_count: i32 = binding.len() as i32;

        // Prepare regexes for rhythm and key matching only if they are not set to "all"
        let rhythm_regex = if rithm != "all" {
            Some(Regex::new(&format!(r"(?m)^R:\s*{}", rithm)).unwrap())
        } else {
            None
        };

        let key_regex = if key != "all" {
            Some(Regex::new(&format!(r"(?m)^K:\s*{}", key)).unwrap())
        } else {
            None
        };

        // Convert page_num to usize for indexing
        let start_index = (page_num as usize) * ITEMS_PER_PAGE;
        let end_index = start_index + ITEMS_PER_PAGE;

        // We need to collect enough filtered items to fill one page, but only after applying all filters
        let mut filtered_tunes = Vec::new();
        let mut current_index = 0;

        // Instead of chunks, iterate manually in batches
        for (key, tune_info) in binding.iter() {
            // Title filter
            let title_match = tune_info.title.to_lowercase().contains(&sub_title.to_lowercase());

            // Rhythm filter
            let rhythm_match = if let Some(ref regex) = rhythm_regex {
                regex.is_match(&tune_info.tune_data)
            } else {
                true
            };

            // Key filter
            let key_match = if let Some(ref regex) = key_regex {
                regex.is_match(&tune_info.tune_data)
            } else {
                true
            };

            // Only add to results if all filters match
            if title_match && rhythm_match && key_match {
                // Collect items within the desired page range
                if current_index >= start_index && current_index < end_index {
                    filtered_tunes.push(types::Tuneinfo {
                        title: tune_info.title.clone(),
                        tune_data: tune_info.tune_data.clone(),
                    });
                }
                current_index += 1;

                // Stop if we've collected enough items for one page
                if filtered_tunes.len() >= ITEMS_PER_PAGE {
                    break;
                }
            }

            // Check if we've already reached the desired number of batches
            if current_index >= end_index {
                break;
            }
        }

        // Return only the filtered tunes for the requested page and the total count for pagination
        (filtered_tunes, total_count)
    })
}



/*
pub fn filter_tunes(
    sub_title: &str,
    rithm: &str,
    key: &str,
    page_num: i32,
) -> (Vec<types::Tuneinfo>, i32) {
    TUNE_STORE.with(|tune_store| {
        let binding = tune_store.borrow();
        let res: Vec<types::Tuneinfo> = binding
            .iter()
            .filter(|(title, tune_info)| {
                let regex_rythm = Regex::new(&format!(r"R:\s*{}", rithm)).unwrap();
                let regex_key = Regex::new(&format!(r"K:\s*{}", key)).unwrap();
                title.to_lowercase().contains(&sub_title.to_lowercase())
                    && (rithm == "all" || regex_rythm.is_match(&tune_info.tune_data.clone()))
                    && (key == "all" || regex_key.is_match(&tune_info.tune_data.clone()))
            })
            .map(|(title, tune_info)| {
                let tune = types::Tuneinfo {
                    title: title.clone(),
                    tune_data: tune_info.tune_data.clone(),
                };
                tune
            })
            .collect();

        let result: Vec<types::Tuneinfo> = res
            .iter()
            .skip(page_num as usize * 15 as usize)
            .enumerate()
            .filter(|(index, _)| index.clone() < 15 as usize)
            .map(|(_, tune)| tune.clone())
            .collect();
        (result, res.len() as i32)
    })
}
    */


/*
pub fn filter_tunes(
    sub_title: &str,
    rithm: &str,
    key: &str,
    page_num: i32,
) -> (Vec<types::Tuneinfo>, i32) {
    TUNE_STORE.with(|tune_store| {
        let tunes: Vec<types::Tuneinfo> = tune_store
            .borrow()
            .iter()
            .skip(page_num as usize * 15)
            .take(15)
            .map(|(_, tune_info)| types::Tuneinfo {
                title: tune_info.title.clone(),
                tune_data: tune_info.tune_data.clone(),
            })
            .collect();

        let total_count = tune_store.borrow().len() as i32;
        (tunes, total_count)
    })
}

*/

    pub fn browse_people(my_principal: String, filter: String, page_num: i32) -> (Vec<types::Friend>, i32) {
        PROFILE_STORE.with(|profile_store| {
            let my_profile = profile_store.borrow().get(&my_principal).unwrap().clone();
            let outcoming_principals: Vec<String> = my_profile.outcoming_fr
                .iter()
                .map(|friend| friend.principal.clone())
                .collect();
    
            let incoming_principals: Vec<String> = my_profile.incoming_fr
                .iter()
                .map(|friend| friend.principal.clone())
                .collect();
    
            // Filter profiles: exclude the current user, friends, and people with existing requests
            let res: Vec<types::Friend> = profile_store
                .borrow()
                .iter()
                .filter(|(_, profile)| 
                    profile.username.to_lowercase().contains(&filter.to_lowercase()) &&
                    profile.principal != my_principal &&  // Exclude current user
                    !my_profile.friends.contains(&profile.principal) &&  // Exclude friends
                    !outcoming_principals.contains(&profile.principal) &&  // Exclude outgoing requests
                    !incoming_principals.contains(&profile.principal)  // Exclude incoming requests
                )
                .map(|(principal, profile)| {
                    let user = types::Friend {
                        principal: principal.clone(),
                        avatar: profile.avatar.clone(),
                        username: profile.username.clone(),
                    };
                    user
                })
                .collect();
    
            let result: Vec<types::Friend> = res
                .iter()
                .skip(page_num as usize * 15)
                .take(15)
                .cloned()
                .collect();
    
            (result, res.len() as i32)
        })
    }
    



pub fn get_new_tunes_from_friends(_principal: String) -> Vec<types::Tune> {
    // let friends = PROFILE_STORE.with(|profile_store| {
    //     let binding = profile_store.borrow();
    //     if binding.get(&principal).is_some() {
    //         binding.get(&principal).unwrap().friends.clone()
    //     } else {
    //         vec![]
    //     }
    // });
    TUNE_STORE.with(|tune_store| {
        tune_store
            .borrow()
            .iter()
            .filter(|(_, tune_info)| ic_cdk::api::time() - tune_info.timestamp < 604800000000000)
            .map(|(_, tune)| tune.clone())
            .collect()
    })
    // USER_TUNE_STORE.with(|user_tune_store| {
    //     let binding = user_tune_store.borrow();
    //     friends.iter().for_each(|friend| {
    //         let frined_tunes = binding.get(friend).unwrap_or(&vec![]).clone();
    //         frined_tunes
    //             .iter()
    //             .filter(|tune| ic_cdk::api::time() - tune.timestamp < 604800000000000)
    //             .for_each(|tune| result.push(tune.clone()));
    //     });
    // });
}


pub fn get_sessions(sub_name: &str, page_num: i32) -> (Vec<types::Session>, i32) {
    SESSION_STORE.with(|session_store| {
        let res: Vec<types::Session> = session_store
            .borrow()
            .iter()
            .filter(|(_, session)| 
                session.name.to_lowercase().contains(&sub_name.to_lowercase()) ||
                session.location.to_lowercase().contains(&sub_name.to_lowercase())
            )
            .map(|(_, session)| session.clone())
            .collect();

        let result: Vec<types::Session> = res
            .iter()
            .skip(page_num as usize * 15 as usize)
            .enumerate()
            .filter(|(index, _)| index.clone() < 15 as usize)
            .map(|(_, session)| session.clone())
            .collect();

        (result, res.len() as i32)
    })
}
    


pub fn add_session(principal: String, username: String, name: String, location: String, daytime: String, contact: String, comment: String, recurring: String) -> bool {
    ic_cdk::println!("Adding session: principal: {}, username: {}, name: {}", principal, username, name); 

    SESSION_STORE.with(|session_store| {
        let new_session = types::Session {
            id: ic_cdk::api::time() as u32,  
            principal,
            username,
            name,
            location,
            daytime,
            contact,
            comment,
            recurring
        };

        session_store.borrow_mut().insert(new_session.id.clone(), new_session);
        true
    })
}

/*
pub fn update_session(id: u32, principal: String, username: String, name: String, location: String, daytime: String, contact: String, recurring: String, comment: String) -> bool {
    SESSION_STORE.with(|session_store| {
        if session_store.borrow().get(&id).is_none() {
            return false;
        }

        let mut updated_session = session_store.borrow().get(&id).unwrap().clone();
        if updated_session.principal != principal {
            return false;
        }

        // update_session.id = id;
        updated_session.principal = principal;
        updated_session.username = username;
        updated_session.name = name;
        updated_session.location = location;
        updated_session.daytime = daytime;
        updated_session.contact = contact;
        updated_session.comment = comment;
        updated_session.recurring = recurring;
        session_store.borrow_mut().insert(id, updated_session);
        true
    })
}
    */

    pub fn update_session(id: u32, principal: String, username: String, name: String, location: String, daytime: String, contact: String, comment: String, recurring: String) -> bool {
        SESSION_STORE.with(|session_store| {

            if session_store.borrow().get(&id).is_none() {
                return false;
            }

            let mut sessions = session_store.borrow().get(&id).unwrap().clone();
            let mut updated_session = session_store.borrow().get(&id).unwrap().clone();
            

                // Ensure the principal matches before allowing updates
                    sessions.principal = principal;
                    sessions.username = username;
                    sessions.name = name;
                    sessions.location = location;
                    sessions.daytime = daytime;
                    sessions.contact = contact;
                    sessions.comment = comment;
                    sessions.recurring = recurring;
    
                    // Reinsert the updated session back into the store
                    session_store.borrow_mut().insert(id, updated_session);
                    true // Successfully updated
            
    
    })
    }

    
    




pub fn delete_session(id: u32, principal: String) -> bool {
    SESSION_STORE.with(|session_store| {
        let mut store = session_store.borrow_mut();

        if let Some(session) = store.get(&id) {
           
            if session.principal == principal {
                store.remove(&id);  
                return true;        
            } else {
                ic_cdk::println!("Unauthorized delete attempt by {}", principal);
                return false;     
            }
        } else {
            ic_cdk::println!("Session with ID {} not found", id);
            return false;          
        }
    })
}


