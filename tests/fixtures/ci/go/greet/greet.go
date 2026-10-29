// Package greet is the fixture module for the go-ci selftest.
package greet

// Hello returns a greeting for name.
func Hello(name string) string {
	return "Hello, " + name + "!"
}
