# react-prop-hooks

Prop hooks help you to modify properties of a state object/array in functional components.

Instead of writing this
```jsx

const Component = () => {
  const [user, setUser] = useState({ firstname: "", lastname: "" });
  
  const hanldeFirstnameChange = useCallback((firstname) => {
    setUser(usr => ({ ...usr, firstname }));
  }, []);
  
  const hanldeLastnameChange = useCallback((lastname) => {
    setUser(usr => ({ ...usr, lastname }));
  }, []);

  return (
    <Form>
      <TextInput value={user.firstname} onChange={hanldeFirstnameChange} />
      <TextInput value={user.lastname} onChange={hanldeLastnameChange} />
    </Form>
  )
}

```

You can write this
```jsx
import { useSetProps } from "react-prop-hooks";

const Component = () => {
  const [user, setUser] = useState({ firstname: "", lastname: "" });
  const getUserPropChangeFn = useSetProps(setUser);
  
  const hanldeFirstnameChange = getUserPropChangeFn("firstname"); // same reference on each rerender
  
  const hanldeLastnameChange = getUserPropChangeFn("lastname"); // same reference on each rerender

  return (
    <Form>
      <TextInput value={user.firstname} onChange={hanldeFirstnameChange} />
      <TextInput value={user.lastname} onChange={hanldeLastnameChange} />
    </Form>
  )
}

```

or this
```jsx
import { useSetProps } from "react-prop-hooks";

const Component = () => {
  const [user, setUser] = useState({ firstname: "", lastname: "" });
  const getUserPropChangeFn = useSetProps(setUser);

  return (
    <Form>
      <TextInput value={user.firstname} onChange={getUserPropChangeFn("firstname")} />
      <TextInput value={user.lastname} onChange={getUserPropChangeFn("lastname")} />
    </Form>
  )
}

```

<br />
<br />

## Custom logic
```jsx
import { useSetProps } from "react-prop-hooks";

const Component = () => {
  const [user, setUser] = useState({ firstname: "", lastname: "" });
  const getUserPropChangeFn = useSetProps(setUser, {
    firstname: (usr, value) => ({ ...usr, firstname: value.length <= 10 ? value : value.substr(0, 10) }),
    reset: (usr) => ({ firstname: "", lastname: "" }),
  });

  return (
    <Form>
      <TextInput value={user.firstname} onChange={getUserPropChangeFn("firstname")} /> {/* will you custom logic. Same reference will be passed to onChange on each render */} 
      <TextInput value={user.lastname} onChange={getUserPropChangeFn("lastname")} />
      <Button onClick={getUserPropChangeFn("reset")}>Reset</Button> {/* Same reference will be passed to onClick on each render */} 
    </Form>
  )
}

```

## Arrays

```jsx
import { useSetProps } from "react-prop-hooks";

const Component = () => {
  const [user, setUser] = useState({ firstname: "", lastname: "", friends: [] });
  const getUserPropChangeFn = useSetProps(setUser);

  return (
    <Form>
      <TextInput value={user.firstname} onChange={getUserPropChangeFn("firstname")} />
      <TextInput value={user.lastname} onChange={getUserPropChangeFn("lastname")} />
      <FriendsList friends={user.friends} onChange={getUserPropChangeFn("friends")} /> {/* will only rerender when user.friends is changed, since FriendsList is wrapped in React.memo */}
    </Form>
  )
}

const FriendsList = React.memo(({ friends, onChange }) => {
  const getFriendsPropChangeFn = useSetProps(onChange, {
    add: (currentFriends) => [...currentFriends, ""]
  });

  return (
    <Box>
      {friends.map((friend, index) => (
        <FlexBox>
          <TextInput value={friend} onChange={getFriendsPropChangeFn(index)} /> {/* you can use useSetProps for arrays too */}
          <Button onClick={getFriendsPropChangeFn.getDeleteFn.byIndex(index)}>X</Button> {/* it provides helper function for deleting element */}
        </FlexBox>
      ))}
      <Button onClick={getFriendsPropChangeFn("add")}>Add friend</Button>
    </Box>
  )
});

```
