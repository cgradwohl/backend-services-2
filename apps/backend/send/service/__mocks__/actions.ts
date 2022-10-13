const actionService = jest.fn(() => ({
  emit: async () => {},
  emitActions: async () => {},
}));

export default actionService;
