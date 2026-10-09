import {
	Button,
	CircularProgress,
	CircularProgressLabel,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	Heading,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";
import { InputField } from "./InputField";

const HouseAddItemSchema = yup.object().shape({
	title: yup
		.string()
		.min(5, "Too Short, Minimum of 5 characters")
		.max(300, "Too Long, Maximum of 300 characters")
		.required("You must add a title to the item"),
	price: yup.number().required("You must add price"),
	type: yup.string(),
	description: yup.string(),
	files: yup.array().min(1, "Add at least one photo"),
	region: yup
		.string()
		.required("You have to add a region the house is located in"),
	city: yup
		.string()
		.required("You have to add a city the house is located in"),
	room: yup.number().min(1, "at least there should be 1 room"),
	area: yup.number().required("Please Specify The area"),
});

export const HouseAddForm = ({ user }) => {
	const router = useRouter();
	const toast = useToast();
	const [uploadProgress, setUploadProgress] = useState(0);

	const initialValues = {
		title: "",
		description: "",
		price: 0.0,
		priceType: "FIXED",
		itemType: "HOUSE",
		files: [],

		area: 0.0,
		room: 1,
		type: "FORSALE",
		region: "",
		city: "",
	};

	const onSubmit = (values, actions) => {
		const formdata = new FormData();
		const { files, ...others } = values;

		for (let key in others) {
			formdata.append(key, others[key]);
		}

		files.forEach((file) => {
			formdata.append("files", file);
		});

		actions.setSubmitting(true);

		axios
			.post("/api/items/add", formdata, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (event) => {
					setUploadProgress((event.loaded * 100) / event.total);
				},
			})
			.then((res) => {
				const { msg } = res.data;

				toast({
					title: "Success",
					status: "success",
					description: msg,
					isClosable: true,
				});
				router.push("/dashboard");
			})
			.catch((error) => {
				const err = error?.response?.data?.err || error?.message || "Unable to submit your listing";
				toast({
					title: "Error",
					status: "error",
					description: err,
					isClosable: true,
				});
			})
			.finally(() => {
				actions.setSubmitting(false);
			});
	};

	return (
		<Formik
			initialValues={initialValues}
			onSubmit={onSubmit}
			validationSchema={HouseAddItemSchema}
			validateOnBlur={true}
		>
			{(formik) => (
				<form
					onSubmit={formik.handleSubmit}
					onReset={formik.handleReset}
				>
					<Flex direction={"column"}>
						<Modal
							closeOnOverlayClick={false}
							closeOnEsc={false}
							onClose={() => {}}
							isOpen={formik.isSubmitting}
						>
							<ModalOverlay></ModalOverlay>
							<ModalContent p="10">
								<ModalBody
									display={"flex"}
									flexDirection={"column"}
									alignItems={"center"}
									justifyContent="center"
								>
									<CircularProgress
										size={"150px"}
										value={uploadProgress}
									>
										<CircularProgressLabel>
											{uploadProgress}%
										</CircularProgressLabel>
									</CircularProgress>
									<Heading mt="4" fontSize="lg">
										Uploading Images...
									</Heading>
								</ModalBody>
							</ModalContent>
						</Modal>
						<SimpleGrid spacing="5" mb="2">
							<InputField
								formik={formik}
								label="Title"
								name="title"
								type="text"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2, 3]} spacing="5" my="2">
							<FormControl>
								<FormLabel>Price Type</FormLabel>
								<Select
									name="priceType"
									value={formik.values.priceType}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="FIXED">Fixed</option>
									<option value="NEGOTIABLE">
										Negotiable
									</option>
								</Select>
							</FormControl>
							<InputField
								formik={formik}
								label="Price"
								name="price"
								type="number"
								suffix={<Text>ETB</Text>}
							/>
							<FormControl>
								<FormLabel>House Type</FormLabel>
								<Select
									name="type"
									value={formik.values.type}
									onChange={formik.handleChange}
									variant={"filled"}
								>
									<option value="RENT">For Rent</option>
									<option value="FORSALE">For Sale</option>
								</Select>
							</FormControl>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5" my="2">
							<InputField
								formik={formik}
								label="Area"
								name="area"
								type="number"
								suffix={
									<Text>
										m<sup>2</sup>
									</Text>
								}
							/>
							<InputField
								formik={formik}
								label="Rooms"
								name="room"
								type="number"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5" my="2">
							<InputField
								formik={formik}
								label="Region"
								name="region"
								type="text"
							/>
							<InputField
								formik={formik}
								label="City"
								name="city"
								type="text"
							/>
						</SimpleGrid>

						<FormControl my="2">
							<FormLabel>Description</FormLabel>
							<Textarea
								name="description"
								onChange={formik.handleChange}
								value={formik.values.description}
								variant={"filled"}
							></Textarea>
						</FormControl>

						<FormControl>
							<FormLabel>Photos</FormLabel>
							<Input
								onChange={(ev) => {
									let files = ev.target.files;
									formik.setFieldValue(
										"files",
										Array.from(files)
									);
								}}
								variant={"filled"}
								type="file"
								name="files"
								accept="image/*"
								placeholder="images"
								multiple
							></Input>
						</FormControl>
						<Grid
							gridTemplateColumns="repeat(auto-fit, 200px)"
							gap={"5"}
							my="4"
						>
							{formik.values.files.map((file, index) => {
								return (
									<Image
										alt={"Selected listing photo " + (index + 1)}
										key={index}
										background={"black"}
										boxShadow="md"
										borderRadius={"md"}
										width={"200px"}
										height={"200px"}
										objectFit="contain"
										src={URL.createObjectURL(file)}
									></Image>
								);
							})}
						</Grid>
						<Flex alignSelf={"flex-end"} mt="5">
							<Button
								mr={"5"}
								type="submit"
								alignSelf={"flex-end"}
								colorScheme="red"
								leftIcon={<MdSave />}
								disabled={
									formik.isSubmitting || !formik.isValid
								}
							>
								{formik.isSubmitting ? "Adding..." : "Add Item"}
							</Button>
							<Button
								mt="16"
								type="button"
								alignSelf={"flex-end"}
								leftIcon={<MdClose />}
								onClick={() => {
									router.push("/dashboard");
								}}
							>
								Cancel
							</Button>
						</Flex>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
