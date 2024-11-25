use ic_cdk;
use crate::types;
use crate::types::Instrument;
use candid::{Decode, Encode};
use serde_json::Value;
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::BTreeMap;
use regex::Regex;
use crate::utils::ic_cdk::api;
use std::borrow::Borrow;
use crate::types::{Forum, ForumData};
use base64::decode;


    
const TUNE_DB_INIT: &str = include_str!("./tunes_output.json");




use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};

type Memory = VirtualMemory<DefaultMemoryImpl>;

type ProfileStore = StableBTreeMap<String, types::Profile, Memory>;
type TuneDB = StableBTreeMap<String, types::Tune, Memory>;
type SessionDB = StableBTreeMap<u32, types::Session, Memory>;
type InstrumentStore = StableBTreeMap<u32, Instrument, Memory>;

type ForumStore = StableBTreeMap<u64, Forum, Memory>;
type ForumDataStore = StableBTreeMap<u64, ForumData, Memory>;





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

impl Storable for types::Instrument {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = Bound::Bounded {
        max_size: 2000000, // Adjust size limit based on requirements
        is_fixed_size: false,
    };
}

impl Storable for types::Forum {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 10000000, // Adjust the max size based on your requirements
        is_fixed_size: false,
    };


}

impl Storable for types::ForumData {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 10000000, // Adjust the max size based on your requirements
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

    pub static INSTRUMENT_STORE: RefCell<InstrumentStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );

    pub static FORUM_STORE: RefCell<ForumStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))) // Forum store
        )
    );

    pub static FORUM_DATA_STORE: RefCell<ForumDataStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6))) // Forum data store
        )
    );
}





pub async fn init() {
    ic_cdk::setup();

    ic_cdk::println!("Initializing tunes from tune_db.json");

    /*
    // Clear the existing tunes
    TUNE_STORE.with(|tune_store| {
        let mut store = tune_store.borrow_mut();
        let old_count = store.len();

        // Use an iterator to get and remove all keys
        let keys_to_remove: Vec<String> = store.iter().map(|(key, _)| key.clone()).collect();
        for key in keys_to_remove {
            store.remove(&key);
        }

        ic_cdk::println!("Cleared {} existing tunes from the canister", old_count);
    });
    */



    // Parse the new tunes from TUNE_DB_INIT
    let parsed: Value = serde_json::from_str(TUNE_DB_INIT).expect("Failed to parse JSON");

    // Add new tunes to the store
    TUNE_STORE.with(|tune_store| {
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
                    username: Some("Tunebook".to_string()),
                };
                tune_store.borrow_mut().insert(key.clone(), new_tune);
                count += 1; // Count the number of tunes processed
            }
            ic_cdk::println!("Successfully loaded {} new tunes into the canister", count);
        } else {
            ic_cdk::println!("Error: tune_db.json is not in the expected format");
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
pub fn get_original_tune_list(principal: String, page_number: i32) -> (Vec<String>, i32) {
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
                    tune_data: tune_info.tune_data.clone(),
                    username: tune_info.username.clone(),
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
    username: Option<String>,
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
            principals,
            username: username.or(Some("Tunebook".to_string())),
        };
        tune_store.borrow_mut().insert(new_tune.title.clone(), new_tune);
        true
    })
}


pub fn remove_tune(principal: String, title: String) -> bool {
    TUNE_STORE.with(|tune_store| {
        let mut store = tune_store.borrow_mut();
        
        if let Some(tune) = store.get(&title) {
            // Check if the user has this tune in theirx tunebook
            if tune.principals.contains(&principal) {
                let mut updated_principals = tune.principals.clone();
                updated_principals.retain(|p| p != &principal); // Remove user's principal from the list
                
                if updated_principals.is_empty() {
                    // If no other user has this tune, delete it
                    store.remove(&title);
                } else {
                    // Update the tune with the new list of principals
                    let updated_tune = types::Tune {
                        principals: updated_principals,
                        ..tune.clone() // Keep other fields the same
                    };
                    store.insert(title, updated_tune);
                }
                
                return true; // Successfully removed tune
            }
        }
        
        false // Tune not found or not owned by user
    })
}


pub async fn update_tune(
    principal: String,
    title: String,
    tune_data: String,
    origin: bool,
    username: Option<String>,
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
            principals: prev_tune.principals,
            username: username.or(Some("Tunebook".to_string())), 
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
                        username: tune_info.username.clone(),
                        
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

pub fn update_session(
    id: u32,
    principal: String,
    username: String,
    name: String,
    location: String,
    daytime: String,
    contact: String,
    comment: String,
    recurring: String,
) -> bool {
    SESSION_STORE.with(|session_store| {
        let mut store = session_store.borrow_mut();

        // Check if the session exists and if the requesting principal owns the session
        if let Some(session) = store.get(&id) {
                // Update the session with new details, preserving the session ID and principal
                let updated_session = types::Session {
                    id,
                    principal,
                    username,
                    name,
                    location,
                    daytime,
                    contact,
                    comment,
                    recurring,
                };

                // Insert the updated session back into the store
                store.insert(id, updated_session);
                return true; // Update successful
        
        } else {
            ic_cdk::println!("Session with ID {} not found", id);
            return false; // Session not found
        }
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

pub fn get_instruments(sub_name: &str, page_num: i32) -> (Vec<types::Instrument>, i32) {
    INSTRUMENT_STORE.with(|instrument_store| {
        let res: Vec<types::Instrument> = instrument_store
            .borrow()
            .iter()
            .filter(|(_, instrument)| 
                instrument.name.to_lowercase().contains(&sub_name.to_lowercase()) ||
                instrument.location.to_lowercase().contains(&sub_name.to_lowercase())
            )
            .map(|(_, instrument)| instrument.clone())
            .collect();

        let result: Vec<types::Instrument> = res
            .iter()
            .skip(page_num as usize * 15) // Pagination logic: Skip previous pages
            .enumerate()
            .filter(|(index, _)| index.clone() < 15) // Limit to 15 instruments per page
            .map(|(_, instrument)| instrument.clone())
            .collect();

        (result, res.len() as i32) // Return the paginated list and total count
    })
}

pub fn add_instrument(
    seller_principal: String,
    buyer_principal: String,
    username: String,
    name: String,
    location: String,
    product: String,
    comment: String,
    price: String,
    photos: Vec<Vec<u8>>,
) -> bool {
    ic_cdk::println!("Adding instrument: seller_principal: {}, username: {}, name: {}", seller_principal, username, name);

    INSTRUMENT_STORE.with(|instrument_store| {
        let new_instrument = types::Instrument {
            id: ic_cdk::api::time() as u32, 
            seller_principal,
            buyer_principal, 
            username,
            name,
            location,
            product,
            comment,
            price,
            photos,
        };

        instrument_store.borrow_mut().insert(new_instrument.id.clone(), new_instrument);
        true
    })
}

pub fn delete_instrument(id: u32, seller_principal: String) -> bool {
    INSTRUMENT_STORE.with(|instrument_store| {
        let mut store = instrument_store.borrow_mut();

        if let Some(instrument) = store.get(&id) {
            if instrument.seller_principal == seller_principal {
                store.remove(&id); // Remove the instrument if the seller matches
                return true;
            } else {
                ic_cdk::println!("Unauthorized delete attempt by {}", seller_principal);
                return false;
            }
        } else {
            ic_cdk::println!("Instrument with ID {} not found", id);
            return false;
        }
    })
}


pub fn get_profile_count() -> u64 {
    PROFILE_STORE.with(|profile_store| {
        profile_store.borrow().len() as u64  // Return the count of profiles
    })
}


pub fn get_tune_count() -> u64 {
    TUNE_STORE.with(|tune_store| {
        tune_store.borrow().len() as u64  // Return the count of tunes
    })
}


pub fn get_session_count() -> u64 {
    SESSION_STORE.with(|session_store| {
        session_store.borrow().len() as u64  // Return the count of sessions
    })
}







/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
                             // Forums
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////




pub fn get_forums(search_term: &str, page_num: i32) -> (Vec<Forum>, i32) {
    FORUM_STORE.with(|forum_store| {
        let forums: Vec<Forum> = forum_store
            .borrow()
            .iter()
            .filter(|(_, forum)| {
                forum
                    .forum_name
                    .to_lowercase()
                    .contains(&search_term.to_lowercase())
                    || forum
                        .username
                        .to_lowercase()
                        .contains(&search_term.to_lowercase())
            })
            .map(|(_, forum)| {
                let mut forum = forum.clone();
                // Ensure threads is initialized if None
                if forum.threads.is_none() {
                    forum.threads = Some(vec![]);
                }
                forum
            })
            .collect();

        let paginated_forums: Vec<Forum> = forums
            .iter()
            .skip(page_num as usize * 15)
            .take(15)
            .cloned()
            .collect();

        (paginated_forums, forums.len() as i32)
    })
}





pub fn add_forum(
    principal: String,
    username: String,
    forum_name: String,
    comment: String,
) -> bool {
    FORUM_STORE.with(|forum_store| {
        let id = ic_cdk::api::time(); // Unique ID
        let new_forum = Forum {
            id,
            poster_principal: principal.clone(),
            username,
            forum_name,
            forum_comment: comment.clone(),
            principals: vec![principal.clone()],
            created_at: ic_cdk::api::time(),
            last_updated_at: None,
            threads: vec![].into(), // Initialize threads as an empty vector
        };

        forum_store.borrow_mut().insert(id, new_forum);
        true
    })
}


pub fn add_post_to_forum(
    forum_id: u64,
    username: String,
    principal: String,
    comment: String,
    photos: Option<Vec<Vec<u8>>>,
) -> bool {

    FORUM_DATA_STORE.with(|forum_data_store| {
        FORUM_STORE.with(|forum_store| {

            let mut forum_store = forum_store.borrow_mut();
            let mut forum_data_store = forum_data_store.borrow_mut();

            if let Some(mut forum) = forum_store.get(&forum_id) {
                let post_id = ic_cdk::api::time(); // Unique ID for post
                let new_post = ForumData {
                    id: post_id,
                    forum_id: Some(forum_id),
                    username,
                    forum_comment: comment,
                    principal,
                    created_at: ic_cdk::api::time(),
                    updated_at: None,
                    photos,
                    likes: 0,
                };

                // Add the post ID to the forum's threads
                if let Some(ref mut threads) = forum.threads {
                    threads.push(post_id); // Append to existing threads
                } else {
                    forum.threads = Some(vec![post_id]); // Initialize threads if None
                }

                forum_store.insert(forum_id, forum); // Update forum
                forum_data_store.insert(post_id, new_post); // Add new post

                true
            } else {
                ic_cdk::println!("Forum with ID {} not found", forum_id);
                false
            }
        })
    })
}



pub fn like_post(post_id: u64, principal: String) -> bool {
    FORUM_DATA_STORE.with(|forum_data_store| {
        let mut store = forum_data_store.borrow_mut();

        if let Some(mut post) = store.get(&post_id) {
            post.likes += 1;
            store.insert(post_id, post);
            true
        } else {
            ic_cdk::println!("Post with ID {} not found", post_id);
            false
        }
    })
}

pub fn update_forum_post(
    post_id: u64,
    principal: String,
    comment: Option<String>,
    photos: Option<Vec<Vec<u8>>>,
) -> bool {
    FORUM_DATA_STORE.with(|forum_data_store| {
        let mut store = forum_data_store.borrow_mut();
        if let Some(mut post) = store.get(&post_id) {
            if post.principal == principal {
                if let Some(new_comment) = comment {
                    if new_comment.trim().is_empty() {
                        ic_cdk::println!("cannot be empty {}", principal);
                    }
                    post.forum_comment = new_comment;
                }
                if let Some(new_photos) = photos {
                    if !new_photos.is_empty() {
                        post.photos = Some(new_photos);
                    }
                }
                post.updated_at = Some(ic_cdk::api::time());
                store.insert(post_id, post);
                return true;
            } else {
                ic_cdk::println!("Unauthorized update attempt by {}", principal);
                return false;
            }
        } else {
            ic_cdk::println!("Post with ID {} not found", post_id);
            false
        }
    })
}




pub fn delete_forum(forum_id: u64, principal: String) -> bool {
    /*
    if !is_admin(&principal) {
        ic_cdk::println!("Unauthorized delete attempt by {}", principal);
        return false; 
    }*/
    

    FORUM_STORE.with(|forum_store| {
        FORUM_DATA_STORE.with(|forum_data_store| {
            let mut forum_store = forum_store.borrow_mut();
            let mut forum_data_store = forum_data_store.borrow_mut();

            if forum_store.remove(&forum_id).is_some() {
                // Manually iterate and remove all posts related to the forum
                let posts_to_remove: Vec<u64> = forum_data_store
                    .iter()
                    .filter(|(_, post)| post.id == forum_id)
                    .map(|(post_id, _)| post_id) // Use post_id directly
                    .collect();

                for post_id in posts_to_remove {
                    forum_data_store.remove(&post_id);
                }

                ic_cdk::println!("Forum with ID {} and its posts were deleted", forum_id);
                true
            } else {
                ic_cdk::println!("Forum with ID {} not found", forum_id);
                false
            }
        })
    })
}



pub fn delete_post(post_id: u64, principal: String) -> bool {

    FORUM_DATA_STORE.with(|forum_data_store| {
        let mut store = forum_data_store.borrow_mut();

        if store.remove(&post_id).is_some() {
            ic_cdk::println!("Post with ID {} was deleted", post_id);
            true
        } else {
            ic_cdk::println!("Post with ID {} not found", post_id);
            false
        }
    })
}

pub fn get_forum_posts(forum_id: u64, page_num: i32) -> Result<(Vec<ForumData>, i32), String> {
    FORUM_DATA_STORE.with(|forum_data_store| {
        let all_posts: Vec<ForumData> = forum_data_store
            .borrow()
            .iter()
            .filter(|(_, post)| post.forum_id == Some(forum_id))
            .map(|(_, post)| post.clone())
            .collect();

        let paginated_posts: Vec<ForumData> = all_posts
            .iter()
            .skip(page_num as usize * 10) // Paginate 10 posts per page
            .take(10)
            .cloned()
            .collect();

        // Check payload size
        let encoded_size = Encode!(&paginated_posts).unwrap().len();
        if encoded_size > 3_145_728 {
            return Err("Response size exceeds 3 MB".to_string());
        }

        Ok((paginated_posts, all_posts.len() as i32))
    })
}

/*
pub fn get_forum_posts(forum_ids: u64, page_num: i32) -> (Vec<ForumData>, i32) {


    FORUM_DATA_STORE.with(|forum_data_store| {
        let res: Vec<ForumData> = forum_data_store
            .borrow()
            .iter()
            .filter(|(_, post)| post.forum_id == Some(forum_ids)) 
            .map(|(_, post)| post.clone())
            .collect();

        let result: Vec<ForumData> = res
            .iter()
            .skip(page_num as usize * 15)
            .take(15)
            .cloned()
            .collect();

        (result, res.len() as i32)
    })
}
*/

pub fn get_forum_posts_without_photos(forum_id: u64, page_num: i32) -> (Vec<ForumData>, i32) {
    FORUM_DATA_STORE.with(|forum_data_store| {
        let posts: Vec<ForumData> = forum_data_store
            .borrow()
            .iter()
            .filter(|(_, post)| post.forum_id == Some(forum_id))
            .map(|(_, post)| {
                let mut post_without_photos = post.clone();
                post_without_photos.photos = None; // Exclude photos
                post_without_photos
            })
            .collect();

        let paginated_posts = posts
            .iter()
            .skip(page_num as usize * 15)
            .take(15)
            .cloned()
            .collect();

        (paginated_posts, posts.len() as i32)
    })
}



    
    pub fn get_post_photos(post_id: u64) -> Option<Vec<Vec<u8>>> {
        FORUM_DATA_STORE.with(|forum_data_store| {
            forum_data_store
                .borrow()
                .get(&post_id)
                .and_then(|post| post.photos.clone())
        })
    }
    


pub fn is_admin(principal: &String) -> bool {
    let admin_principals = vec![
        "zhaxx-r7zkt-gffvf-jvw46-hxhj5-xewo7-cwrq6-nmza3-wpiwz-swnet-vqe".to_string(), // Replace with actual admin IDs
    ];
    admin_principals.contains(principal)
}


