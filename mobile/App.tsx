import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./src/lib/supabase";
import LoginScreen from "./src/screens/LoginScreen";
import AppNavigator from "./src/navigation/AppNavigator";

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      {session ? <AppNavigator /> : <Stack.Navigator><Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} /></Stack.Navigator>}
    </NavigationContainer>
  );
}
