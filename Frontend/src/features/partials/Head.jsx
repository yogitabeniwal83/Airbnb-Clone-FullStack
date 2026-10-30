const Head = ({ pageTitle = 'Airbnb' }) => {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{pageTitle}</title>
      <link rel="stylesheet" href="/output.css" />
    </>
  )
}

export default Head
