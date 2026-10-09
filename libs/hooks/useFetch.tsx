import { useEffect, useState } from "react";

interface IFetch {
	fetchFunction: () => Promise<any>;
	dependencies?: any[];
}

const useFetch = ({ fetchFunction, dependencies = [] }: IFetch) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		fetchFunction()
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
	}, [...dependencies]);

	return [data, loading, error];
};

export { useFetch };
