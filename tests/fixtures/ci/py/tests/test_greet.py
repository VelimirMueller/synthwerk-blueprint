from fixture_app import greet


def test_greet_name_says_hello() -> None:
    assert greet("Ada") == "Hello, Ada!"
