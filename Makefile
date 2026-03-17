BINARY  := invite-bonus
CMD     := ./cmd/server
GOFLAGS ?=

.PHONY: build clean tidy deps

build:
	go build $(GOFLAGS) -o $(BINARY) $(CMD)

clean:
	rm -f $(BINARY)

tidy:
	go mod tidy

deps:
	go mod download
