const renderColSpan = (columnSpan?: number) => {
  if (!renderColSpan || columnSpan === 1) {
    return "";
  }

  return ` colspan="${columnSpan}"`;
};

export default renderColSpan;
