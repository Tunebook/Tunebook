use candid::{CandidType, Deserialize};

#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Profile {
    pub principal: String,
    pub username: String,
    pub avatar: Vec<u8>,
    pub pob: String,
    pub instruments: String,
    pub bio: Option<String>,
    pub friends: Vec<String>,
    pub incoming_fr: Vec<Friend>,
    pub outcoming_fr: Vec<Friend>
}

#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Tune {
    pub origin: bool,
    pub title: String,
    pub tune_data: String,
    pub timestamp: u64,
    pub principals: Vec<String>,
    pub username: Option<String>,
}

#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Session {
    pub id: u32,
    pub principal: String,
    pub username: String,
    pub name: String,
    pub location: String,
    pub daytime: String,
    pub contact: String,
    pub comment: String,
    pub recurring: String,
}

#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Friend {
    pub principal: String,
    pub avatar: Vec<u8>,
    pub username: String
}

#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Tuneinfo {
    pub title: String,
    pub tune_data: String,
    pub username: Option<String>,
}
    
#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Instrument {
    pub id: u32,
    pub seller_principal: String,
    pub buyer_principal: String,
    pub username: String,
    pub name: String,
    pub location: String,
    //pub contact: String,
    pub product: String,
    pub comment: String,
    pub price: String,
    pub photos: Vec<Vec<u8>>,
}


#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct Forum {
    pub id: u64,                     
    pub poster_principal: String,    
    pub username: String,        
    pub forum_name: String,        
    pub forum_comment: String,    
    pub principals: Vec<String>,     
    pub created_at: u64,            
    pub last_updated_at: Option<u64>,
    pub threads: Option<Vec<u64>>
}

#[derive(CandidType, Clone, Deserialize, Debug)]
pub struct ForumData {
    pub id: u64, 
    pub forum_id: Option<u64>,                  
    pub username: String,         
    pub forum_comment: String,      
    pub principal: String,     
    pub created_at: u64,           
    pub updated_at: Option<u64>,     
    pub photos: Option<Vec<Vec<u8>>>,
    pub likes: u32,                  
}
