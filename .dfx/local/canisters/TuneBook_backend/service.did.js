export const idlFactory = ({ IDL }) => {
  const Friend = IDL.Record({
    'principal' : IDL.Text,
    'username' : IDL.Text,
    'avatar' : IDL.Vec(IDL.Nat8),
  });
  const Profile = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'pob' : IDL.Text,
    'principal' : IDL.Text,
    'username' : IDL.Text,
    'incoming_fr' : IDL.Vec(Friend),
    'outcoming_fr' : IDL.Vec(Friend),
    'instruments' : IDL.Text,
    'friends' : IDL.Vec(IDL.Text),
    'avatar' : IDL.Vec(IDL.Nat8),
  });
  const Tuneinfo = IDL.Record({
    'title' : IDL.Text,
    'username' : IDL.Opt(IDL.Text),
    'tune_data' : IDL.Text,
  });
  const Instrument = IDL.Record({
    'id' : IDL.Nat32,
    'username' : IDL.Text,
    'name' : IDL.Text,
    'comment' : IDL.Text,
    'seller_principal' : IDL.Text,
    'buyer_principal' : IDL.Text,
    'price' : IDL.Text,
    'location' : IDL.Text,
    'product' : IDL.Text,
    'photos' : IDL.Vec(IDL.Vec(IDL.Nat8)),
  });
  const Tune = IDL.Record({
    'title' : IDL.Text,
    'username' : IDL.Opt(IDL.Text),
    'origin' : IDL.Bool,
    'timestamp' : IDL.Nat64,
    'principals' : IDL.Vec(IDL.Text),
    'tune_data' : IDL.Opt(IDL.Text),
  });
  const Session = IDL.Record({
    'id' : IDL.Nat32,
    'principal' : IDL.Text,
    'contact' : IDL.Text,
    'username' : IDL.Text,
    'name' : IDL.Text,
    'recurring' : IDL.Text,
    'comment' : IDL.Text,
    'location' : IDL.Text,
    'daytime' : IDL.Text,
  });
  return IDL.Service({
    'accept_friend_request' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'add_instrument' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Vec(IDL.Nat8)),
        ],
        [IDL.Bool],
        [],
      ),
    'add_session' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
        ],
        [IDL.Bool],
        [],
      ),
    'add_tune' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Text],
        [IDL.Bool],
        [],
      ),
    'authentication' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], ['query']),
    'browse_people' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Int32],
        [IDL.Vec(Friend), IDL.Int32],
        ['query'],
      ),
    'cancel_friend_request' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'delete_instrument' : IDL.Func([IDL.Nat32, IDL.Text], [IDL.Bool], []),
    'delete_session' : IDL.Func([IDL.Nat32, IDL.Text], [IDL.Bool], []),
    'filter_tunes' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Int32],
        [IDL.Vec(Tuneinfo), IDL.Int32],
        ['query'],
      ),
    'get_friends' : IDL.Func([IDL.Text], [IDL.Vec(Friend)], ['query']),
    'get_instruments' : IDL.Func(
        [IDL.Text, IDL.Int32],
        [IDL.Vec(Instrument), IDL.Int32],
        ['query'],
      ),
    'get_new_tunes_from_friends' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Tune)],
        ['query'],
      ),
    'get_original_tune' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'get_original_tune_list' : IDL.Func(
        [IDL.Int32],
        [IDL.Vec(IDL.Text), IDL.Int32],
        ['query'],
      ),
    'get_profile_count' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_session_count' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_sessions' : IDL.Func(
        [IDL.Text, IDL.Int32],
        [IDL.Vec(Session), IDL.Int32],
        ['query'],
      ),
    'get_tune_count' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_user_tune' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']),
    'get_user_tune_list' : IDL.Func(
        [IDL.Text, IDL.Int32],
        [IDL.Vec(Tuneinfo), IDL.Int32],
        ['query'],
      ),
    'remove_tune' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'send_friend_request' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Opt(Friend)],
        [],
      ),
    'update_profile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8)],
        [Profile],
        [],
      ),
    'update_session' : IDL.Func(
        [
          IDL.Nat32,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
        ],
        [IDL.Bool],
        [],
      ),
    'update_tune' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Text],
        [IDL.Bool],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return [IDL.Nat64]; };
