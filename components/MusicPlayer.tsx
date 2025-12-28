import { borderRadius, spacing, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
   Animated,
   Modal,
   Platform,
   ScrollView,
   StyleSheet,
   Text,
   TouchableOpacity,
   View
} from "react-native";

// Curated workout playlists
const WORKOUT_PLAYLISTS = {
  spotify: [
    {
      id: "37i9dQZF1DX76Wlfdnj7AP",
      name: "Beast Mode",
      description: "High energy workout hits",
      image: "https://i.scdn.co/image/ab67706f00000003b0fe40a6e1692822f5a9d8f1",
      genre: "Hip-Hop/EDM",
    },
    {
      id: "37i9dQZF1DX70RN3TfWWJh",
      name: "Cardio",
      description: "Running & cardio workout mix",
      image: "https://i.scdn.co/image/ab67706f00000003e9e7b6c39ea0b9c7d9e0c5e1",
      genre: "Pop/Dance",
    },
    {
      id: "37i9dQZF1DX32NsLKyzScr",
      name: "Power Workout",
      description: "Heavy lifting energy",
      image: "https://i.scdn.co/image/ab67706f000000030f6b8e8c9c0f0c8e8c9c0f0c",
      genre: "Rock/Metal",
    },
    {
      id: "37i9dQZF1DWZq91oLsHZvy",
      name: "Motivation Mix",
      description: "Stay motivated and focused",
      image: "https://i.scdn.co/image/ab67706f00000003d9f8e8c9c0f0c8e8c9c0f0c",
      genre: "Mixed",
    },
    {
      id: "37i9dQZF1DX0hWmn8d5pRe",
      name: "Yoga & Stretch",
      description: "Calm and peaceful vibes",
      image: "https://i.scdn.co/image/ab67706f00000003a9f8e8c9c0f0c8e8c9c0f0c",
      genre: "Ambient",
    },
    {
      id: "37i9dQZF1DX4eRPd9frC1m",
      name: "Hype",
      description: "Get pumped up",
      image: "https://i.scdn.co/image/ab67706f00000003b9f8e8c9c0f0c8e8c9c0f0c",
      genre: "Hip-Hop",
    },
    {
      id: "37i9dQZF1DWWvvyNmW5hNT",
      name: "Khmer Hits",
      description: "Top Cambodian songs",
      image: "",
      genre: "Khmer Pop",
    },
    {
      id: "37i9dQZF1DX1PfYnYcpuMZ",
      name: "Khmer Workout",
      description: "Energetic Khmer beats",
      image: "",
      genre: "Khmer",
    },
    {
      id: "5Rrf7iqzByMBKvpUYfPiAz",
      name: "Khmer Party Mix",
      description: "Khmer dance & party songs",
      image: "",
      genre: "Khmer Dance",
    },
    {
      id: "3cEYpjA9oz9GiPac4AsH4n",
      name: "Khmer Classics",
      description: "Classic Cambodian favorites",
      image: "",
      genre: "Khmer Classic",
    },
    {
      id: "37i9dQZF1DX5gQonLbZD9s",
      name: "Sigma Grindset",
      description: "Phonk & dark trap for the grind",
      image: "",
      genre: "Phonk",
    },
    {
      id: "37i9dQZF1DWTl4y3vgJOXW",
      name: "Drive Forever",
      description: "Sigma vibes & slowed edits",
      image: "",
      genre: "Phonk/Drift",
    },
    {
      id: "1h4gEpRsglpOQvXPpXRrJv",
      name: "Gigachad Energy",
      description: "Ultimate sigma workout anthems",
      image: "",
      genre: "Bass/Trap",
    },
    {
      id: "37i9dQZF1DX1spT6G94GFC",
      name: "Dark Phonk",
      description: "Aggressive phonk beats",
      image: "",
      genre: "Phonk",
    },
    {
      id: "37i9dQZF1DX0BcQWzuB7ZO",
      name: "Metamorphosis",
      description: "Interworld & sigma anthems",
      image: "",
      genre: "Electronic",
    },
  ],
  apple: [
    {
      id: "pl.2b0e6e332fdf4b7a91164da3162127b5",
      name: "Pure Workout",
      description: "Apple's top workout hits",
      image: "",
      genre: "Mixed",
    },
    {
      id: "pl.f4d106fed2bd41149aaacabb233eb5eb",
      name: "Pure Fitness",
      description: "Get in the zone",
      image: "",
      genre: "Electronic",
    },
    {
      id: "pl.acc464c750b94302b8806e5fcbe56e17",
      name: "Running Workout",
      description: "Perfect pace for running",
      image: "",
      genre: "Pop",
    },
  ],
};

interface MusicPlayerProps {
  minimized?: boolean;
}

export function MusicPlayer({ minimized = true }: MusicPlayerProps) {
  const { colors, accentColor } = useSettings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [selectedService, setSelectedService] = useState<"spotify" | "apple">("spotify");
  const [currentPlaylist, setCurrentPlaylist] = useState<typeof WORKOUT_PLAYLISTS.spotify[0] | null>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation for playing state
  React.useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  const openSpotifyPlaylist = async (playlistId: string) => {
    const spotifyUri = `spotify:playlist:${playlistId}`;
    const spotifyWebUrl = `https://open.spotify.com/playlist/${playlistId}`;
    
    try {
      const canOpen = await Linking.canOpenURL(spotifyUri);
      if (canOpen) {
        await Linking.openURL(spotifyUri);
      } else {
        await Linking.openURL(spotifyWebUrl);
      }
      setIsPlaying(true);
    } catch (error) {
      console.log("Error opening Spotify:", error);
      await Linking.openURL(spotifyWebUrl);
    }
  };

  const openAppleMusicPlaylist = async (playlistId: string) => {
    const appleMusicUrl = `https://music.apple.com/playlist/${playlistId}`;
    const appleMusicUri = `music://music.apple.com/playlist/${playlistId}`;
    
    try {
      const canOpen = await Linking.canOpenURL(appleMusicUri);
      if (canOpen) {
        await Linking.openURL(appleMusicUri);
      } else {
        await Linking.openURL(appleMusicUrl);
      }
      setIsPlaying(true);
    } catch (error) {
      console.log("Error opening Apple Music:", error);
      await Linking.openURL(appleMusicUrl);
    }
  };

  const handlePlayPause = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSelectPlaylist = (playlist: typeof WORKOUT_PLAYLISTS.spotify[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCurrentPlaylist(playlist);
    setShowPlaylistPicker(false);
    
    if (selectedService === "spotify") {
      openSpotifyPlaylist(playlist.id);
    } else {
      openAppleMusicPlaylist(playlist.id);
    }
  };

  const handleOpenMusicApp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (selectedService === "spotify") {
      Linking.openURL("spotify://");
    } else {
      Linking.openURL("music://");
    }
  };

  // Minimized player widget
  if (minimized) {
    return (
      <>
        <TouchableOpacity
          style={[styles.minimizedPlayer, { backgroundColor: colors.surface }]}
          onPress={() => setShowPlaylistPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.minimizedLeft}>
            <Animated.View style={[styles.musicIconContainer, { backgroundColor: accentColor + "20", transform: [{ scale: isPlaying ? pulseAnim : 1 }] }]}>
              <Ionicons name="musical-notes" size={20} color={accentColor} />
            </Animated.View>
            <View style={styles.minimizedInfo}>
              <Text style={[styles.minimizedTitle, { color: colors.text }]} numberOfLines={1}>
                {currentPlaylist?.name || "Workout Music"}
              </Text>
              <Text style={[styles.minimizedSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {currentPlaylist ? currentPlaylist.genre : "Tap to select a playlist"}
              </Text>
            </View>
          </View>
          <View style={styles.minimizedControls}>
            {currentPlaylist && (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.background }]}
                onPress={handlePlayPause}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: accentColor }]}
              onPress={() => setShowPlaylistPicker(true)}
            >
              <Ionicons name="list" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Playlist Picker Modal */}
        <Modal
          visible={showPlaylistPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPlaylistPicker(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Workout Playlists</Text>
              <TouchableOpacity onPress={() => setShowPlaylistPicker(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Service Tabs */}
            <View style={[styles.serviceTabs, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.serviceTab,
                  selectedService === "spotify" && { backgroundColor: "#1DB954" },
                ]}
                onPress={() => setSelectedService("spotify")}
              >
                <Ionicons
                  name="musical-notes"
                  size={20}
                  color={selectedService === "spotify" ? "#FFFFFF" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.serviceTabText,
                    { color: selectedService === "spotify" ? "#FFFFFF" : colors.textSecondary },
                  ]}
                >
                  Spotify
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.serviceTab,
                  selectedService === "apple" && { backgroundColor: "#FA243C" },
                ]}
                onPress={() => setSelectedService("apple")}
              >
                <Ionicons
                  name="musical-note"
                  size={20}
                  color={selectedService === "apple" ? "#FFFFFF" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.serviceTabText,
                    { color: selectedService === "apple" ? "#FFFFFF" : colors.textSecondary },
                  ]}
                >
                  Apple Music
                </Text>
              </TouchableOpacity>
            </View>

            {/* Open App Button */}
            <TouchableOpacity
              style={[styles.openAppButton, { backgroundColor: colors.surface }]}
              onPress={handleOpenMusicApp}
            >
              <Ionicons
                name={selectedService === "spotify" ? "musical-notes" : "musical-note"}
                size={24}
                color={selectedService === "spotify" ? "#1DB954" : "#FA243C"}
              />
              <Text style={[styles.openAppText, { color: colors.text }]}>
                Open {selectedService === "spotify" ? "Spotify" : "Apple Music"}
              </Text>
              <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Curated Workout Playlists
            </Text>

            <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
              {(selectedService === "spotify" ? WORKOUT_PLAYLISTS.spotify : WORKOUT_PLAYLISTS.apple).map(
                (playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={[
                      styles.playlistItem,
                      { backgroundColor: colors.surface },
                      currentPlaylist?.id === playlist.id && { borderColor: accentColor, borderWidth: 2 },
                    ]}
                    onPress={() => handleSelectPlaylist(playlist)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.playlistImage,
                        { backgroundColor: selectedService === "spotify" ? "#1DB95420" : "#FA243C20" },
                      ]}
                    >
                      <Ionicons
                        name="musical-notes"
                        size={28}
                        color={selectedService === "spotify" ? "#1DB954" : "#FA243C"}
                      />
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={[styles.playlistName, { color: colors.text }]}>{playlist.name}</Text>
                      <Text style={[styles.playlistDescription, { color: colors.textSecondary }]}>
                        {playlist.description}
                      </Text>
                      <View style={[styles.genreBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.genreText, { color: colors.textMuted }]}>{playlist.genre}</Text>
                      </View>
                    </View>
                    <Ionicons name="play-circle" size={32} color={accentColor} />
                  </TouchableOpacity>
                )
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
      </>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  minimizedPlayer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  minimizedLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  musicIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  minimizedSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  minimizedControls: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.h2,
  },
  serviceTabs: {
    flexDirection: "row",
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  serviceTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  serviceTabText: {
    ...typography.body,
    fontWeight: "600",
  },
  openAppButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  openAppText: {
    ...typography.body,
    fontWeight: "500",
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  playlistList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  playlistDescription: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  genreBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  genreText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
