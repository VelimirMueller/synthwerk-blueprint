package greet

import "testing"

func TestHello(t *testing.T) {
	if got := Hello("Ada"); got != "Hello, Ada!" {
		t.Fatalf("Hello(%q) = %q", "Ada", got)
	}
}
