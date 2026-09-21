import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GYMATE 🔥</Text>

      <Text style={styles.subtitle}>
        Your fitness journey starts here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
  },
});