import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import DashboardScreen from "../screens/DashboardScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import LeaveRequestScreen from "../screens/LeaveRequestScreen";
import SubmissionStatusScreen from "../screens/SubmissionStatusScreen";
import ScheduleScreen from "../screens/ScheduleScreen";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Dashboard: "home", Schedule: "calendar", LeaveRequest: "add-circle",
          Attendance: "list", Submissions: "document-text",
        };
        return <Ionicons name={icons[route.name] || "help"} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#0d9488", headerStyle: { backgroundColor: "#0d9488" },
      headerTintColor: "#fff",
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: "My Schedule" }} />
      <Tab.Screen name="LeaveRequest" component={LeaveRequestScreen} options={{ title: "New Leave" }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: "My Attendance" }} />
      <Tab.Screen name="Submissions" component={SubmissionStatusScreen} options={{ title: "My Submissions" }} />
    </Tab.Navigator>
  );
}
