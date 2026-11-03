import { useEffect, useRef, useState } from "react";

interface IFetch<T> {
	fetchFunction: () => Promise<{ data: T }>;
	dependencies?: readonly unknown[];
}

const useFetch = <T = any,>({ fetchFunction, dependencies = [] }: IFetch<T>) => {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const fetchRef = useRef(fetchFunction);
	const dependencyKey = JSON.stringify(dependencies);

	useEffect(() => {
		fetchRef.current = fetchFunction;
	}, [fetchFunction]);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		fetchRef.current()
			.then((res) => {
				if (active) setData(res.data);
			})
			.catch((err) => {
				if (active) setError(err);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [dependencyKey]);

	return [data, loading, error] as const;
};

export { useFetch };
