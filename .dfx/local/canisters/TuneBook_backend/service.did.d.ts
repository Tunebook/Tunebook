import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Friend {
  'principal' : string,
  'username' : string,
  'avatar' : Uint8Array | number[],
}
export interface Instrument {
  'id' : number,
  'username' : string,
  'name' : string,
  'comment' : string,
  'seller_principal' : string,
  'buyer_principal' : string,
  'price' : string,
  'location' : string,
  'product' : string,
  'photos' : Array<Uint8Array | number[]>,
}
export interface Profile {
  'bio' : [] | [string],
  'pob' : string,
  'principal' : string,
  'username' : string,
  'incoming_fr' : Array<Friend>,
  'outcoming_fr' : Array<Friend>,
  'instruments' : string,
  'friends' : Array<string>,
  'avatar' : Uint8Array | number[],
}
export interface Session {
  'id' : number,
  'principal' : string,
  'contact' : string,
  'username' : string,
  'name' : string,
  'recurring' : string,
  'comment' : string,
  'location' : string,
  'daytime' : string,
}
export interface Tune {
  'title' : string,
  'username' : [] | [string],
  'origin' : boolean,
  'timestamp' : bigint,
  'principals' : Array<string>,
  'tune_data' : [] | [string],
}
export interface Tuneinfo {
  'title' : string,
  'username' : [] | [string],
  'tune_data' : string,
}
export interface _SERVICE {
  'accept_friend_request' : ActorMethod<[string, string], boolean>,
  'add_instrument' : ActorMethod<
    [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      Array<Uint8Array | number[]>,
    ],
    boolean
  >,
  'add_session' : ActorMethod<
    [string, string, string, string, string, string, string, string],
    boolean
  >,
  'add_tune' : ActorMethod<[string, string, string, boolean, string], boolean>,
  'authentication' : ActorMethod<[string], [] | [Profile]>,
  'browse_people' : ActorMethod<
    [string, string, number],
    [Array<Friend>, number]
  >,
  'cancel_friend_request' : ActorMethod<[string, string], boolean>,
  'delete_instrument' : ActorMethod<[number, string], boolean>,
  'delete_session' : ActorMethod<[number, string], boolean>,
  'filter_tunes' : ActorMethod<
    [string, string, string, number],
    [Array<Tuneinfo>, number]
  >,
  'get_friends' : ActorMethod<[string], Array<Friend>>,
  'get_instruments' : ActorMethod<
    [string, number],
    [Array<Instrument>, number]
  >,
  'get_new_tunes_from_friends' : ActorMethod<[string], Array<Tune>>,
  'get_original_tune' : ActorMethod<[string], string>,
  'get_original_tune_list' : ActorMethod<[number], [Array<string>, number]>,
  'get_profile_count' : ActorMethod<[], bigint>,
  'get_session_count' : ActorMethod<[], bigint>,
  'get_sessions' : ActorMethod<[string, number], [Array<Session>, number]>,
  'get_tune_count' : ActorMethod<[], bigint>,
  'get_user_tune' : ActorMethod<[string, string], string>,
  'get_user_tune_list' : ActorMethod<
    [string, number],
    [Array<Tuneinfo>, number]
  >,
  'remove_tune' : ActorMethod<[string, string], boolean>,
  'send_friend_request' : ActorMethod<[string, string], [] | [Friend]>,
  'update_profile' : ActorMethod<
    [string, string, string, string, string, Uint8Array | number[]],
    Profile
  >,
  'update_session' : ActorMethod<
    [number, string, string, string, string, string, string, string, string],
    boolean
  >,
  'update_tune' : ActorMethod<
    [string, string, string, boolean, string],
    boolean
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
