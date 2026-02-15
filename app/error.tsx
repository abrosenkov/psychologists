"use client";

interface Props {
  error: Error;
}

export default function Error({ error }: Props) {
  return <p>Could not fetch the list of campers. {error.message}</p>;
}
