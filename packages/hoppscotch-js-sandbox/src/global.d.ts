// If your TypeScript project is written in a functional programming style using fp-ts and io-ts, many of the values you'll want to check in your unit tests will come wrapped inside container types like Either, Option, or These. 
// Jest has no awareness of these container types and no built-in matchers to help you to compare wrapped values against un-wrapped values. 
// This leaves you with two options:
// Extract the received value from the container type before using a jest matcher.
// Lift the expected value into a container of the expected type before using a jest matcher.
// Both options work, but tend to make your tests somewhat verbose, adding unnecessary work when writing your tests, and making it harder to read and maintain them.
import "@relmify/jest-fp-ts"
