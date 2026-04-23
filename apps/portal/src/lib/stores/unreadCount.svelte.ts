class UnreadCountStore {
	total = $state(0);

	set(count: number) {
		this.total = count;
	}

	/** Clear the unread count for a room the user is currently viewing. */
	clearRoom(roomCount: number) {
		this.total = Math.max(0, this.total - roomCount);
	}
}

export const unreadCount = new UnreadCountStore();
