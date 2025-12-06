

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Redirect } from "expo-router";
import { colors } from "@/constants/theme";
import AuthScreen from "./auth";

export default function Index() {
  return (
    <View style={styles.container}>
      <AuthLoading>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>
        <Redirect href="/(tabs)" />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

